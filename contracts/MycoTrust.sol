// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * ╭─────────────────────────────────────────────────────────────────────╮
 * │  MycoTrust — soulbound reputation for Mycorrhizal Governance         │
 * │                                                                      │
 * │  This is NOT a token. It is a non-transferable reputation score      │
 * │  that grows through ongoing participation and decays through         │
 * │  silence. It is the governance counterpart to $MYCEL.                │
 * │                                                                      │
 * │  $MYCEL flows (earned, spent, gifted)                                │
 * │  mycoTrust grows (and fades)                                         │
 * │                                                                      │
 * │  Trust accrues from:                                                 │
 * │    • Owner awards for verified deep contributions                    │
 * │    • Peer endorsements from other trusted members (monthly budget)   │
 * │    • Automatic touches when sporing/drawing activity occurs          │
 * │                                                                      │
 * │  Trust decays at 1% per month of inactivity (zero touches).          │
 * │  This mimics mycelial reality — connections without flow wither.    │
 * │                                                                      │
 * │  Trust is used to:                                                   │
 * │    • Weight votes in Snapshot proposals                              │
 * │    • Grant peer-endorsement budgets                                  │
 * │    • Identify trusted council seats during dispute resolution        │
 * │                                                                      │
 * │  Trust is NEVER required to:                                         │
 * │    • Receive Hyphae                                                  │
 * │    • Draw products                                                   │
 * │    • Attend events                                                   │
 * │  Trust influences voice, not access.                                 │
 * ╰─────────────────────────────────────────────────────────────────────╯
 */
contract MycoTrust is Ownable {
    /// @notice Raw trust score before decay
    mapping(address => uint256) public rawTrust;

    /// @notice Last activity timestamp (any sporing, drawing, or endorsement)
    mapping(address => uint256) public lastActivity;

    /// @notice First time this address received any trust
    mapping(address => uint256) public memberSince;

    /// @notice How much endorsement budget a member has used this calendar month
    mapping(address => mapping(uint256 => uint256)) public endorsementsThisMonth;

    /// @notice Monthly endorsement budget — peers can allocate up to this per month
    uint256 public endorsementBudget = 10;

    /// @notice Decay rate in basis points per 30 days of inactivity (100 = 1%)
    uint256 public decayPerMonthBps = 100;

    /// @notice Authorised pingers (the MycelToken contract calls touchRoots)
    mapping(address => bool) public pingers;

    event TrustAwarded(address indexed to, uint256 amount, string reason);
    event Endorsed(address indexed from, address indexed to, uint256 amount, string note);
    event TouchedRoots(address indexed member);
    event PingerSet(address indexed pinger, bool allowed);

    constructor() Ownable(msg.sender) {
        pingers[msg.sender] = true;
    }

    // ── Awarding trust ────────────────────────────────────────────────

    /// @notice Owner awards trust for verified deep contributions
    function awardTrust(address member, uint256 amount, string calldata reason) external onlyOwner {
        _award(member, amount);
        emit TrustAwarded(member, amount, reason);
    }

    /// @notice Owner awards trust to many members in one transaction
    function batchAward(address[] calldata members, uint256 amount, string calldata reason) external onlyOwner {
        for (uint256 i = 0; i < members.length; i++) {
            _award(members[i], amount);
            emit TrustAwarded(members[i], amount, reason);
        }
    }

    // ── Peer endorsement ──────────────────────────────────────────────

    /// @notice Members with active trust can endorse each other (peer governance)
    function endorse(address member, uint256 amount, string calldata note) external {
        require(getActiveTrust(msg.sender) > 0, "Need active trust to endorse");
        require(member != msg.sender, "Cannot endorse self");
        uint256 month = block.timestamp / 30 days;
        require(endorsementsThisMonth[msg.sender][month] + amount <= endorsementBudget, "Monthly budget exhausted");
        endorsementsThisMonth[msg.sender][month] += amount;
        _award(member, amount);
        _ping(msg.sender);
        emit Endorsed(msg.sender, member, amount, note);
    }

    // ── Activity pings ────────────────────────────────────────────────

    /// @notice Called by authorised pingers (MycelToken) on activity
    function touchRoots(address member) external {
        require(pingers[msg.sender], "Not an authorised pinger");
        _ping(member);
    }

    // ── Reading trust ─────────────────────────────────────────────────

    /// @notice Effective trust after decay calculation
    function getActiveTrust(address member) public view returns (uint256) {
        if (rawTrust[member] == 0) return 0;
        if (lastActivity[member] == 0) return 0;
        uint256 monthsInactive = (block.timestamp - lastActivity[member]) / 30 days;
        if (monthsInactive == 0) return rawTrust[member];
        uint256 decayBps = monthsInactive * decayPerMonthBps;
        if (decayBps >= 10000) return 0; // fully decayed
        return rawTrust[member] * (10000 - decayBps) / 10000;
    }

    function isActiveMember(address member) external view returns (bool) {
        return getActiveTrust(member) > 0;
    }

    function monthsAsMember(address member) external view returns (uint256) {
        if (memberSince[member] == 0) return 0;
        return (block.timestamp - memberSince[member]) / 30 days;
    }

    // ── Administration ────────────────────────────────────────────────

    function setEndorsementBudget(uint256 newBudget) external onlyOwner {
        endorsementBudget = newBudget;
    }

    function setDecayRate(uint256 newBps) external onlyOwner {
        require(newBps <= 1000, "Decay rate too high"); // max 10% per month
        decayPerMonthBps = newBps;
    }

    /// @notice Authorise the MycelToken (or any contract) to call touchRoots
    function setPinger(address pinger, bool allowed) external onlyOwner {
        pingers[pinger] = allowed;
        emit PingerSet(pinger, allowed);
    }

    // ── Internal ──────────────────────────────────────────────────────

    function _award(address member, uint256 amount) internal {
        if (memberSince[member] == 0) memberSince[member] = block.timestamp;
        rawTrust[member] += amount;
        _ping(member);
    }

    function _ping(address member) internal {
        lastActivity[member] = block.timestamp;
        emit TouchedRoots(member);
    }
}
