// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * ╭─────────────────────────────────────────────────────────────────────╮
 * │  $MYCEL — Fungai Art Mycelium                                        │
 * │  Members call these "Hyphae" (the connecting threads of the network) │
 * │                                                                      │
 * │  Issued by:  Fungai Art OÜ (Estonia, e-Residency entity)             │
 * │  Network:    Polygon mainnet · chainId 137                           │
 * │  Max supply: 88,888,888 MYCEL (8 = infinity ∞)                       │
 * │  Annual mint ceiling: 4,444,444 MYCEL (5% of max) — owner-bounded   │
 * │                                                                      │
 * │  A UTILITY CIRCULATION TOKEN — not a membership badge, not a         │
 * │  security, not an investment. Internal medium of exchange for        │
 * │  goods and experiences within the Fungai Art network.                │
 * │                                                                      │
 * │  Hyphae are SPORED (earned) for contributions:                       │
 * │    foraging sessions · event support · alchemy days · teaching       │
 * │  Hyphae are DRAWN (spent) on:                                        │
 * │    tinctures · ceremony access · retreats · special extracts         │
 * │  Hyphae are GIFTED member-to-member with notes.                      │
 * │  Hyphae are COMPOSTED (burned) to return scarcity.                   │
 * │                                                                      │
 * │  Reference rate (published, NOT enforced on-chain):                  │
 * │    1 MYCEL ≈ basket value of cacao + olive oil + gold                │
 * │    Updated monthly at fungai.art/basket                              │
 * │                                                                      │
 * │  GOVERNANCE LIVES SEPARATELY — see MycoTrust.sol (soulbound).        │
 * │  Hyphae holdings DO NOT confer voting power.                         │
 * │                                                                      │
 * │  Never listed on DEX/CEX. Transfers between members are permitted    │
 * │  for gifting only. Speculative trading is contrary to spirit.        │
 * ╰─────────────────────────────────────────────────────────────────────╯
 */
contract MycelToken is ERC20, Ownable {
    /// @notice Maximum supply: 88,888,888 MYCEL. 8 = infinity (Chinese cosmology, sideways ∞).
    /// At full network activity (~1.3M minted/year), this is decades of runway.
    uint256 public constant MAX_SUPPLY = 88_888_888 * 10**18;

    /// @notice Treasury that receives drawn Hyphae. Settable by owner.
    address public mycelium;

    /// @notice Optional trust contract notified on activity (set after deployment)
    address public trustContract;

    /// @notice Annual mint ceiling — owner self-restrains to prevent unilateral inflation.
    /// Default 5% of MAX_SUPPLY per calendar year. Settable but with a hard upper bound.
    uint256 public annualMintCeiling = 4_444_444 * 10**18; // 5% of 88,888,888

    /// @notice Tracks tokens minted per calendar year (year = block.timestamp / 365.25 days)
    mapping(uint256 => uint256) public mintedInYear;

    /// @notice Emitted when a member is rewarded Hyphae for a contribution
    /// @param actionType keccak256 of action category: "foraging_session", "event_help", "alchemy_day", "teaching", etc.
    event Sporing(address indexed member, uint256 amount, bytes32 indexed actionType, string note);

    /// @notice Emitted when a member spends Hyphae for a product/experience
    /// @param productType keccak256 of product category: "tincture_30ml", "ceremony_access", "retreat", etc.
    event Drawing(address indexed member, uint256 amount, bytes32 indexed productType, string note);

    /// @notice Emitted when one member gifts Hyphae to another (intra-network reciprocity)
    event Gifted(address indexed from, address indexed to, uint256 amount, string note);

    /// @notice Emitted when annual mint ceiling is changed
    event AnnualCeilingUpdated(uint256 newCeiling);

    constructor(address _mycelium) ERC20("Fungai Art Mycelium", "MYCEL") Ownable(msg.sender) {
        require(_mycelium != address(0), "Mycelium treasury required");
        mycelium = _mycelium;
    }

    /// @dev Enforces both MAX_SUPPLY and annual ceiling
    function _enforceMintLimits(uint256 raw) internal {
        require(totalSupply() + raw <= MAX_SUPPLY, "Would exceed MAX_SUPPLY");
        uint256 year = block.timestamp / 365 days;
        require(mintedInYear[year] + raw <= annualMintCeiling, "Would exceed annual ceiling");
        mintedInYear[year] += raw;
    }

    // ── Sporing (earning) ─────────────────────────────────────────────

    /// @notice Award Hyphae to a member for a verified contribution
    /// @param to Member's wallet
    /// @param amount Whole Hyphae (function multiplies by 10**18)
    /// @param actionType keccak256(bytes(<category string>))
    /// @param note Free-form context: "Königshyttan circle 15 June", "Saffron lecture"
    function spore(address to, uint256 amount, bytes32 actionType, string calldata note) external onlyOwner {
        uint256 raw = amount * 10**18;
        _enforceMintLimits(raw);
        _mint(to, raw);
        emit Sporing(to, amount, actionType, note);
        _pingTrust(to);
    }

    /// @notice Spore the same amount to many members in one transaction
    function batchSpore(
        address[] calldata recipients,
        uint256 amountEach,
        bytes32 actionType,
        string calldata note
    ) external onlyOwner {
        uint256 raw = amountEach * 10**18;
        _enforceMintLimits(raw * recipients.length);
        for (uint256 i = 0; i < recipients.length; i++) {
            _mint(recipients[i], raw);
            emit Sporing(recipients[i], amountEach, actionType, note);
            _pingTrust(recipients[i]);
        }
    }

    /// @notice Spore different amounts to different members in one transaction
    function preciseSpore(
        address[] calldata recipients,
        uint256[] calldata amounts,
        bytes32 actionType,
        string calldata note
    ) external onlyOwner {
        require(recipients.length == amounts.length, "Length mismatch");
        uint256 total;
        for (uint256 i = 0; i < amounts.length; i++) total += amounts[i] * 10**18;
        _enforceMintLimits(total);
        for (uint256 i = 0; i < recipients.length; i++) {
            _mint(recipients[i], amounts[i] * 10**18);
            emit Sporing(recipients[i], amounts[i], actionType, note);
            _pingTrust(recipients[i]);
        }
    }

    // ── Drawing (spending) ────────────────────────────────────────────

    /// @notice Spend Hyphae on a product or experience. Tokens flow to The Mycelium.
    function draw(uint256 amount, bytes32 productType, string calldata note) external {
        uint256 raw = amount * 10**18;
        require(balanceOf(msg.sender) >= raw, "Insufficient Hyphae");
        _transfer(msg.sender, mycelium, raw);
        emit Drawing(msg.sender, amount, productType, note);
        _pingTrust(msg.sender);
    }

    // ── Gifting (member to member) ────────────────────────────────────

    /// @notice Gift Hyphae to another member with a note
    /// Standard ERC20 transfer also works, but this emits a Gifted event for the social feed
    function gift(address to, uint256 amount, string calldata note) external {
        uint256 raw = amount * 10**18;
        _transfer(msg.sender, to, raw);
        emit Gifted(msg.sender, to, amount, note);
        _pingTrust(msg.sender);
        _pingTrust(to);
    }

    // ── Composting (burn) ─────────────────────────────────────────────

    /// @notice Anyone can burn their own Hyphae (returning to soil)
    function compost(uint256 amount) external {
        _burn(msg.sender, amount * 10**18);
    }

    /// @notice The Mycelium treasury composts drawn Hyphae back to soil
    function compostFromTreasury(uint256 amount) external onlyOwner {
        _burn(mycelium, amount * 10**18);
    }

    // ── Administration ────────────────────────────────────────────────

    function setMycelium(address _mycelium) external onlyOwner {
        require(_mycelium != address(0), "Zero address");
        mycelium = _mycelium;
    }

    function setTrustContract(address _trust) external onlyOwner {
        trustContract = _trust;
    }

    /// @notice Owner can adjust annual mint ceiling, but never above 10% of MAX_SUPPLY
    function setAnnualMintCeiling(uint256 newCeiling) external onlyOwner {
        require(newCeiling <= MAX_SUPPLY / 10, "Ceiling cannot exceed 10% of max supply");
        annualMintCeiling = newCeiling;
        emit AnnualCeilingUpdated(newCeiling);
    }

    // ── Helpers ───────────────────────────────────────────────────────

    function balanceOfWhole(address wallet) external view returns (uint256) {
        return balanceOf(wallet) / 10**18;
    }

    function totalSupplyWhole() external view returns (uint256) {
        return totalSupply() / 10**18;
    }

    function _pingTrust(address member) internal {
        if (trustContract != address(0)) {
            // Notify the trust contract; ignore failure so token transfers can never be blocked
            (bool ok, ) = trustContract.call(abi.encodeWithSignature("touchRoots(address)", member));
            ok; // silence unused warning
        }
    }
}
