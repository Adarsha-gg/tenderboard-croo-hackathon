module tenderboard::reputation_stake;

use std::string::{Self, String};
use sui::balance::{Self, Balance};
use sui::coin::{Self, Coin};
use sui::event;
use sui::object::{Self, ID, UID};
use sui::sui::SUI;
use sui::transfer;
use sui::tx_context::{Self, TxContext};

const E_NOT_OWNER: u64 = 1;
const E_ZERO_STAKE: u64 = 2;
const E_INSUFFICIENT_STAKE: u64 = 3;

/// Owner-held economic bond for a worker passport.
///
/// The Walrus/Sui receipt proves work happened. This object makes reputation
/// economically accountable: challenges can burn/reward real SUI against a
/// specific worker identity and evidence hash.
public struct StakePosition has key {
    id: UID,
    owner: address,
    worker_agent_id: String,
    staked: Balance<SUI>,
    slash_count: u64,
    total_slashed_mist: u64,
}

public struct StakeOpened has copy, drop {
    sender: address,
    position_id: ID,
    worker_agent_id: String,
    amount_mist: u64,
}

public struct StakeAdded has copy, drop {
    sender: address,
    position_id: ID,
    worker_agent_id: String,
    amount_mist: u64,
    total_staked_mist: u64,
}

public struct StakeSlashed has copy, drop {
    challenger: address,
    position_id: ID,
    owner: address,
    worker_agent_id: String,
    evidence_hash: String,
    reason: String,
    slash_amount_mist: u64,
    remaining_stake_mist: u64,
    slash_count: u64,
}

public entry fun open_position(
    worker_agent_id: vector<u8>,
    stake: Coin<SUI>,
    ctx: &mut TxContext,
) {
    let amount = coin::value(&stake);
    assert!(amount > 0, E_ZERO_STAKE);

    let position = StakePosition {
        id: object::new(ctx),
        owner: tx_context::sender(ctx),
        worker_agent_id: string::utf8(worker_agent_id),
        staked: coin::into_balance(stake),
        slash_count: 0,
        total_slashed_mist: 0,
    };
    let position_id = object::id(&position);
    event::emit(StakeOpened {
        sender: tx_context::sender(ctx),
        position_id,
        worker_agent_id: position.worker_agent_id,
        amount_mist: amount,
    });
    transfer::transfer(position, tx_context::sender(ctx));
}

public entry fun add_stake(
    position: &mut StakePosition,
    stake: Coin<SUI>,
    ctx: &mut TxContext,
) {
    assert!(position.owner == tx_context::sender(ctx), E_NOT_OWNER);

    let amount = coin::value(&stake);
    assert!(amount > 0, E_ZERO_STAKE);
    balance::join(&mut position.staked, coin::into_balance(stake));

    event::emit(StakeAdded {
        sender: tx_context::sender(ctx),
        position_id: object::id(position),
        worker_agent_id: position.worker_agent_id,
        amount_mist: amount,
        total_staked_mist: balance::value(&position.staked),
    });
}

public entry fun challenge_and_slash(
    position: &mut StakePosition,
    evidence_hash: vector<u8>,
    reason: vector<u8>,
    slash_amount_mist: u64,
    ctx: &mut TxContext,
) {
    assert!(slash_amount_mist > 0, E_ZERO_STAKE);
    assert!(balance::value(&position.staked) >= slash_amount_mist, E_INSUFFICIENT_STAKE);

    let slashed = balance::split(&mut position.staked, slash_amount_mist);
    position.slash_count = position.slash_count + 1;
    position.total_slashed_mist = position.total_slashed_mist + slash_amount_mist;

    event::emit(StakeSlashed {
        challenger: tx_context::sender(ctx),
        position_id: object::id(position),
        owner: position.owner,
        worker_agent_id: position.worker_agent_id,
        evidence_hash: string::utf8(evidence_hash),
        reason: string::utf8(reason),
        slash_amount_mist,
        remaining_stake_mist: balance::value(&position.staked),
        slash_count: position.slash_count,
    });

    transfer::public_transfer(coin::from_balance(slashed, ctx), tx_context::sender(ctx));
}

public fun owner(position: &StakePosition): address {
    position.owner
}

public fun worker_agent_id(position: &StakePosition): String {
    position.worker_agent_id
}

public fun staked_mist(position: &StakePosition): u64 {
    balance::value(&position.staked)
}

public fun slash_count(position: &StakePosition): u64 {
    position.slash_count
}

public fun total_slashed_mist(position: &StakePosition): u64 {
    position.total_slashed_mist
}
