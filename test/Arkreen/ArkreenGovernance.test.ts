import { ArkreenGovernor, ArkreenToken, ArkreenTimeLock } from "../../typechain"

import { ethers, upgrades } from "hardhat"
import { assert } from "chai"
import { mine } from "@nomicfoundation/hardhat-network-helpers";

// Governor Values
export const QUORUM_PERCENTAGE = 4 // Need 4% of voters to pass
export const MIN_DELAY = 60*60*24*4 // 4 days - after a vote passes, you have 1 hour before you can enact
export const VOTING_PERIOD = 50400 // 1 week - how long the vote lasts. This is pretty long even for local tests
export const VOTING_DELAY = 1 // 1 Block - How many blocks till a proposal vote becomes active
export const ADDRESS_ZERO = "0x0000000000000000000000000000000000000000"

export const PROPOSAL_DESCRIPTION = "Proposal #1"

describe("Governor Flow", async () => {
    let governor: ArkreenGovernor
    let governanceToken: ArkreenToken
    let timeLock: ArkreenTimeLock
    const voteWay = 1 // for
    const reason = "My reason"


    beforeEach(async () => {
        const [owner] = await ethers.getSigners();

        // Contract factories
        const GovernorFactory = await ethers.getContractFactory("DimoGovernor")
        const TimeLockFactory = await ethers.getContractFactory("TimeLock")
        const DimoTokenFactoryV1 = await ethers.getContractFactory("DimoChildTokenV1")
        const DimoTokenFactoryV2 = await ethers.getContractFactory("contracts/Polygon/ChildToken/DimoV2.sol:Dimo")

        // Dimo Token version 01 (without ERC20VotesUpgradeable)
        const dimoTokenV1 = await upgrades.deployProxy(DimoTokenFactoryV1, {
            initializer: "initialize",
            kind: "uups",
        }) as ArkreenToken;

        const MINTER_ROLE = await dimoTokenV1.MINTER_ROLE();
        const PAUSER_ROLE = await dimoTokenV1.PAUSER_ROLE();
        const UPGRADER_ROLE = await dimoTokenV1.UPGRADER_ROLE();

        await dimoTokenV1.grantRole(MINTER_ROLE, owner.address);
        await dimoTokenV1.grantRole(PAUSER_ROLE, owner.address);
        await dimoTokenV1.grantRole(UPGRADER_ROLE, owner.address);
        await dimoTokenV1.mint(owner.address, "100000");

        // Upgrading Dimo Token to version 02 (with ERC20VotesUpgradeable)
        governanceToken = await upgrades.upgradeProxy(dimoTokenV1.address, DimoTokenFactoryV2) as Dimo;
        // Function to write total supply checkpoint in the ERC20VotesUpgradeable to avoid overflow
        await governanceToken.writeTotalSupplyCheckpoint();
        // Delegate to yourself to vote
        await governanceToken.delegate(owner.address);

        const BURNER_ROLE = await governanceToken.BURNER_ROLE();

        // Deploy TimeLock
        timeLock = await upgrades.deployProxy(TimeLockFactory, [MIN_DELAY, [owner.address], [owner.address], owner.address], {
            initializer: "initialize",
            kind: "uups",
        }) as TimeLock;

        // Deploy Governor
        governor = await upgrades.deployProxy(GovernorFactory, [governanceToken.address, timeLock.address], {
            initializer: "initialize",
            kind: "uups",
        }) as DimoGovernor;

        const PROPOSER_ROLE = await timeLock.PROPOSER_ROLE();
        const EXECUTOR_ROLE = await timeLock.EXECUTOR_ROLE();

        // Granting roles
        await timeLock.grantRole(PROPOSER_ROLE, governor.address);
        await timeLock.grantRole(EXECUTOR_ROLE, governor.address);
        await governanceToken.grantRole(MINTER_ROLE, timeLock.address);
        await governanceToken.grantRole(BURNER_ROLE, timeLock.address);
    })

    it("proposes, votes, waits, queues, and then executes minting proposal", async () => {
        const [owner] = await ethers.getSigners();
        const amountToMint = 100;
        const initialTotalSupply = await governanceToken.totalSupply();
        const finalTotalSupply = initialTotalSupply.add(amountToMint);

        // propose
        console.log("Proposing...")
        const encodedFunctionCall = governanceToken.interface.encodeFunctionData("mint", [owner.address, amountToMint])
        const proposeTx = await governor.propose(
            [governanceToken.address],
            [0],
            [encodedFunctionCall],
            PROPOSAL_DESCRIPTION
        )
        const proposeReceipt = await proposeTx.wait(1)
        const proposalId = proposeReceipt.events![0].args!.proposalId
        let proposalState = await governor.state(proposalId)
        console.log(`Current Proposal State: ${proposalState}`)

        await mine(VOTING_DELAY + 1)
        await ethers.provider.send("evm_increaseTime", [VOTING_DELAY + 1]);

        // vote
        console.log("Voting...")
        const voteTx = await governor.castVoteWithReason(proposalId, voteWay, reason)
        await voteTx.wait(1)
        proposalState = await governor.state(proposalId)
        assert.equal(proposalState.toString(), "1")
        console.log(`Current Proposal State: ${proposalState}`)
        await mine(VOTING_PERIOD + 1)

        // queue
        console.log("Queueing...")
        const descriptionHash = ethers.utils.id(PROPOSAL_DESCRIPTION)
        const queueTx = await governor.connect(owner).queue([governanceToken.address], [0], [encodedFunctionCall], descriptionHash)
        await queueTx.wait(1)
        await ethers.provider.send("evm_increaseTime", [MIN_DELAY + 1]);
        await mine(1)

        // execute
        console.log("Executing...")
        const exTx = await governor.execute([governanceToken.address], [0], [encodedFunctionCall], descriptionHash)
        await exTx.wait(1)

        assert.equal((await governanceToken.totalSupply()).toString(), finalTotalSupply.toString());
    })

    it("proposes, votes, waits, queues, and then executes burning proposal", async () => {
        const [owner] = await ethers.getSigners();
        const amountToBurn = 100;
        const initialTotalSupply = await governanceToken.totalSupply();
        const finalTotalSupply = initialTotalSupply.sub(amountToBurn);

        // propose
        console.log("Proposing...")
        const encodedFunctionCall = governanceToken.interface.encodeFunctionData("burn", [owner.address, amountToBurn])
        const proposeTx = await governor.propose(
            [governanceToken.address],
            [0],
            [encodedFunctionCall],
            PROPOSAL_DESCRIPTION
        )
        const proposeReceipt = await proposeTx.wait(1)
        const proposalId = proposeReceipt.events![0].args!.proposalId
        let proposalState = await governor.state(proposalId)
        console.log(`Current Proposal State: ${proposalState}`)

        await mine(VOTING_DELAY + 1)
        await ethers.provider.send("evm_increaseTime", [VOTING_DELAY + 1]);

        // vote
        console.log("Voting...")
        const voteTx = await governor.castVoteWithReason(proposalId, voteWay, reason)
        await voteTx.wait(1)
        proposalState = await governor.state(proposalId)
        assert.equal(proposalState.toString(), "1")
        console.log(`Current Proposal State: ${proposalState}`)
        await mine(VOTING_PERIOD + 1)

        // queue
        console.log("Queueing...")
        const descriptionHash = ethers.utils.id(PROPOSAL_DESCRIPTION)
        const queueTx = await governor.connect(owner).queue([governanceToken.address], [0], [encodedFunctionCall], descriptionHash)
        await queueTx.wait(1)
        await ethers.provider.send("evm_increaseTime", [MIN_DELAY + 1]);
        await mine(1)

        // execute
        console.log("Executing...")
        const exTx = await governor.execute([governanceToken.address], [0], [encodedFunctionCall], descriptionHash)
        await exTx.wait(1)

        assert.equal((await governanceToken.totalSupply()).toString(), finalTotalSupply.toString());
    })



    it("proposes, votes, waits, queues, and then executes burning proposal", async () => {
        const [owner] = await ethers.getSigners();
        console.log(await governor["quorumNumerator()"]());

        // propose
        console.log("Proposing...")
        const encodedFunctionCall = governor.interface.encodeFunctionData("updateQuorumNumerator", [5])
        const proposeTx = await governor.propose(
            [governor.address],
            [0],
            [encodedFunctionCall],
            PROPOSAL_DESCRIPTION
        )
        const proposeReceipt = await proposeTx.wait(1)
        const proposalId = proposeReceipt.events![0].args!.proposalId
        let proposalState = await governor.state(proposalId)
        console.log(`Current Proposal State: ${proposalState}`)

        await mine(VOTING_DELAY + 1)
        await ethers.provider.send("evm_increaseTime", [VOTING_DELAY + 1]);

        // vote
        console.log("Voting...")
        const voteTx = await governor.castVoteWithReason(proposalId, voteWay, reason)
        await voteTx.wait(1)
        proposalState = await governor.state(proposalId)
        assert.equal(proposalState.toString(), "1")
        console.log(`Current Proposal State: ${proposalState}`)
        await mine(VOTING_PERIOD + 1)

        // queue
        console.log("Queueing...")
        const descriptionHash = ethers.utils.id(PROPOSAL_DESCRIPTION)
        const queueTx = await governor.connect(owner).queue([governor.address], [0], [encodedFunctionCall], descriptionHash)
        await queueTx.wait(1)
        await ethers.provider.send("evm_increaseTime", [MIN_DELAY + 1]);
        await mine(1)
        proposalState = await governor.state(proposalId)
        assert.equal(proposalState.toString(), "5")
        console.log(`Current Proposal State: ${proposalState}`)

        // execute
        console.log("Executing...")
        const exTx = await governor.execute([governor.address], [0], [encodedFunctionCall], descriptionHash)
        await exTx.wait(1)

        console.log(await governor["quorumNumerator()"]());
    })
})