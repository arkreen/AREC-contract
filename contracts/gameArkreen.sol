// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

import "./interfaces/IERC20.sol";
import "./types/ERC20.sol";
import "./types/Ownable.sol";

contract gameArkreen is ERC20, Ownable {

    // Totally last 64 Merkle tree roots are stored. But only the lastest one is effective. 
    // All previous ones are saved just for reference.
    bytes32[64] internal allRewardRoots;

    // Pointer of the lastest reward Merkle tree root.
    uint256     internal currentReward;

    // Timestamp of the last block update the reward merkle root.
    uint256     public  TimeLastReward;

    // The counter of the last claim, to protect against re-claiming
    // As multiple transactions can happen within one block, so use counter instead of block height/timestamp
    uint256     public  CountLastClaim;

    // All claimed tokens, for the audit purpose
    uint256     public  AllClaimed;

    // Time before which gAKRE claimig is blocked temporarily in emergent case 
    // In normal case, do not need to trigger this mechanism 
    uint256     public  TimeBlockedBefore;

    // Mint to DEAD address so that no one transfer the token except the owner.
    address     public immutable DEAD_ADDRESS = 0x000000000000000000000000000000000000dEaD;

    // This event is triggered whenever a call to #claim succeeds.
    event Claimed(uint256 counter, address claimer, uint256 amount);

    struct Claim {
        uint64          timeClaimed;
        uint128         amountClaimed;
    }   

    mapping(address => Claim) public ClaimInfo;

    constructor()  ERC20("Arkreen Game Reward", "gAKRE", 18)
    {}

    /**
     * @dev Update the reward Merkle root.
     * @param _claimLast the last claim count till this Merkle root is calculate.
     * @param _newMint the amount to token newly minted.
     * @param _rewardRoot the overall reward Merkle tree root with claimed token moved.
     */
    function rewardUpdate(uint256 _claimLast, uint256 _newMint, bytes32 _rewardRoot) external onlyOwner {
        // The Merkle root is applied to the claim of #_claimLast, which must keep same as the last claim counter
        require(_claimLast == CountLastClaim, "Game Arkreen: New Claim Happened");

        // Move to next position
        if(currentReward >= (allRewardRoots.length-1)) {
            currentReward = 0;
        } else {
            currentReward += 1;
        }

        // Save the new Merkle root
        allRewardRoots[currentReward] = _rewardRoot;

        // Update reward distribution time
        TimeLastReward = block.timestamp;

        // Mint the new reward to the DEAD address
        _mint(DEAD_ADDRESS, _newMint);

        // Clear the emergent blocking
        TimeBlockedBefore = 0;
    }

    /**
     * @dev Claim the gAKRE token claimable to the #claimer address
     * @param claimer the claimer address
     * @param amount the amount to claim
     * @param merkleProof the proof to claim the gAKRE
     */
    function claim(address claimer, uint256 amount, bytes32[] calldata merkleProof) external {

        // Check if temporarily blocked
        require(block.timestamp > TimeBlockedBefore, 'Game Arkreen: Temporarily Blocked');

        // Protect againt re-claiming
        require(ClaimInfo[claimer].timeClaimed < TimeLastReward, 'Game Arkreen: Already Claimed');

        // Verify the merkle proof.
        bytes32 node = keccak256(abi.encodePacked(claimer, amount));
        require(MerkleProof.verify(merkleProof, allRewardRoots[currentReward], node), 'Game Arkreen: Invalid Proof');

        // Send out the claimed token.
        _transfer(DEAD_ADDRESS, claimer, amount);

        // Set claim counter and emit the claim event
        CountLastClaim += 1;
        emit Claimed(CountLastClaim, claimer, amount);

        // Update the total claimed amount, just for purpose of audit
        AllClaimed += amount;

        // Save the claim information
        Claim memory claimInfo;
        claimInfo.timeClaimed = uint64(block.timestamp);
        claimInfo.amountClaimed = uint128(amount);

        ClaimInfo[claimer] = claimInfo;
    }

    /**
     * @dev Get the lastest reward distribution information
     * @return claimCount times of the total claim
     * @return updateTime timestamp of last reward merkle root updating
     * @return lastRoot the lastest merkle root
     */
    function GetLastRewardInfo() external view returns (uint256 claimCount, uint256 updateTime, bytes32 lastRoot) {
        claimCount = CountLastClaim;
        updateTime = TimeLastReward;
        lastRoot = allRewardRoots[currentReward];
    }

    /**
     * @dev Get the merkle root specified by the index
     * @param index the merkle root index
     * @return merkleRoot the indexed merkle root
     */
    function GetRewardRoot(uint256 index) external view returns (bytes32 merkleRoot) {
        require(index < allRewardRoots.length, 'Game Arkreen: Wrong Index');
        uint256 _index = (allRewardRoots.length + currentReward - index) % allRewardRoots.length;
        merkleRoot = allRewardRoots[_index];
    }

    /**
     * @dev Temporarily block the claiming to update reward root in the case of emergency 
     * @param timeInSeconds the block duration in seconds from current block
     */
    function EmergentBlock(uint256 timeInSeconds) external onlyOwner {
        TimeBlockedBefore = block.timestamp + timeInSeconds;
    }
}
