// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * ╭───────────────────────────────────────────────────────────────────╮
 * │  $HYPHA — Fungai Art membership token                              │
 * │                                                                    │
 * │  Polygon mainnet (chainId 137).                                    │
 * │  ERC-20 with a fixed maximum supply of 1,000,000.                  │
 * │  Owner (Robin) mints to community members. Members cannot mint.    │
 * │                                                                    │
 * │  This is NOT a security. It confers no equity, no revenue rights,  │
 * │  no governance power over Fungai Art. Its only function is to      │
 * │  identify members who have access to:                              │
 * │    • Alchemy Academy                                               │
 * │    • Members-only events (foraging circles, Mycelium Trance)       │
 * │    • Special extracts (member-exclusive elixirs)                   │
 * │                                                                    │
 * │  Not listed on any DEX or CEX. Transferable so members can gift    │
 * │  to each other, but never intended for speculative trading.        │
 * ╰───────────────────────────────────────────────────────────────────╯
 */
contract HyphaToken is ERC20, Ownable {
    /// @notice Maximum tokens that can ever exist
    uint256 public constant MAX_SUPPLY = 1_000_000 * 10**18; // 1M HYPHA

    /// @notice Emitted when a new member is minted tokens
    event MemberMinted(address indexed member, uint256 amount, string note);

    constructor() ERC20("Fungai Art Hypha", "HYPHA") Ownable(msg.sender) {}

    /// @notice Mint tokens to a single member (owner only)
    /// @param to Member's wallet address
    /// @param amount Whole tokens (e.g. 1 for 1 HYPHA — function adds the 18 decimals)
    /// @param note Optional context ("Founding member", "Q3 cohort", etc.)
    function mintMember(address to, uint256 amount, string calldata note) external onlyOwner {
        uint256 raw = amount * 10**18;
        require(totalSupply() + raw <= MAX_SUPPLY, "Would exceed max supply");
        _mint(to, raw);
        emit MemberMinted(to, amount, note);
    }

    /// @notice Mint the same amount to many members at once (owner only)
    function batchMint(address[] calldata recipients, uint256 amountEach) external onlyOwner {
        uint256 raw = amountEach * 10**18;
        require(totalSupply() + (raw * recipients.length) <= MAX_SUPPLY, "Would exceed max supply");
        for (uint256 i = 0; i < recipients.length; i++) {
            _mint(recipients[i], raw);
            emit MemberMinted(recipients[i], amountEach, "batch");
        }
    }

    /// @notice A member can voluntarily burn their tokens (e.g. to leave)
    function burn(uint256 amount) external {
        _burn(msg.sender, amount * 10**18);
    }

    /// @notice Check whether a wallet is currently a member (holds any HYPHA)
    function isMember(address wallet) external view returns (bool) {
        return balanceOf(wallet) > 0;
    }

    /// @notice Human-readable balance (whole tokens, not wei-equivalent)
    function balanceOfWhole(address wallet) external view returns (uint256) {
        return balanceOf(wallet) / 10**18;
    }
}
