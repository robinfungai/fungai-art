// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * ╭─────────────────────────────────────────────────────────────────────╮
 * │  $MYCEL — Fungai Art Mycelium                                        │
 * │  Members call these "Hyphae" (the connecting threads of the network) │
 * │                                                                      │
 * │  Polygon mainnet · chainId 137                                       │
 * │                                                                      │
 * │  A CIRCULATION TOKEN — not a membership badge.                       │
 * │  Hyphae are SPORED (earned) for contributions:                       │
 * │    foraging sessions · event support · alchemy days · teaching       │
 * │  Hyphae are DRAWN (spent) on:                                        │
 * │    tinctures · ceremony access · retreats · special extracts         │
 * │                                                                      │
 * │  Drawn tokens flow to The Mycelium (treasury) where they are         │
 * │  recycled or burned. The more active the network, the more flow.    │
 * │                                                                      │
 * │  GOVERNANCE LIVES SEPARATELY — see MycoTrust.sol (soulbound).        │
 * │  Hyphae holdings DO NOT confer voting power. Voice grows through     │
 * │  ongoing relational depth (mycoTrust), not accumulation.             │
 * │                                                                      │
 * │  $MYCEL is not a security. No equity, no revenue rights, no          │
 * │  governance via balance. Never listed on DEX/CEX.                    │
 * ╰─────────────────────────────────────────────────────────────────────╯
 */
contract MycelToken is ERC20, Ownable {
    /// @notice Treasury that receives drawn Hyphae. Settable by owner.
    address public mycelium;

    /// @notice Optional trust contract notified on activity (set after deployment)
    address public trustContract;

    /// @notice Emitted when a member is rewarded Hyphae for a contribution
    /// @param actionType keccak256 of action category: "foraging_session", "event_help", "alchemy_day", "teaching", etc.
    event Sporing(address indexed member, uint256 amount, bytes32 indexed actionType, string note);

    /// @notice Emitted when a member spends Hyphae for a product/experience
    /// @param productType keccak256 of product category: "tincture_30ml", "ceremony_access", "retreat", etc.
    event Drawing(address indexed member, uint256 amount, bytes32 indexed productType, string note);

    /// @notice Emitted when one member gifts Hyphae to another (intra-network reciprocity)
    event Gifted(address indexed from, address indexed to, uint256 amount, string note);

    constructor(address _mycelium) ERC20("Fungai Art Mycelium", "MYCEL") Ownable(msg.sender) {
        require(_mycelium != address(0), "Mycelium treasury required");
        mycelium = _mycelium;
    }

    // ── Sporing (earning) ─────────────────────────────────────────────

    /// @notice Award Hyphae to a member for a verified contribution
    /// @param to Member's wallet
    /// @param amount Whole Hyphae (function multiplies by 10**18)
    /// @param actionType keccak256(bytes(<category string>))
    /// @param note Free-form context: "Königshyttan circle 15 June", "Saffron lecture"
    function spore(address to, uint256 amount, bytes32 actionType, string calldata note) external onlyOwner {
        uint256 raw = amount * 10**18;
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
