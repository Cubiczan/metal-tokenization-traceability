use anchor_lang::prelude::*;

declare_id!("11111111111111111111111111111111");

#[program]
pub mod reserve_registry {
    use super::*;

    /// Register a new physical vault
    pub fn register_vault(
        ctx: Context<RegisterVault>,
        name: String,
        location: String,
        custodian: String,
    ) -> Result<()> {
        require!(name.len() <= 64, RegistryError::NameTooLong);
        require!(location.len() <= 64, RegistryError::LocationTooLong);

        let vault = &mut ctx.accounts.vault;
        vault.authority = ctx.accounts.authority.key();
        vault.name = name;
        vault.location = location;
        vault.custodian = custodian;
        vault.active = true;
        vault.created_at = Clock::get()?.unix_timestamp;
        vault.last_attestation = 0;
        vault.bump = ctx.bumps.vault;

        msg!("Vault registered: {}", vault.name);
        Ok(())
    }

    /// Submit a reserve attestation (MPC threshold: requires 3/5 signers)
    pub fn submit_attestation(
        ctx: Context<SubmitAttestation>,
        metal_type: u8,
        amount_oz: u64,
        bar_count: u32,
        attestation_hash: [u8; 32],
    ) -> Result<()> {
        let attestation = &mut ctx.accounts.attestation;
        let vault = &mut ctx.accounts.vault;

        require!(vault.active, RegistryError::VaultInactive);

        attestation.vault = vault.key();
        attestation.signer = ctx.accounts.signer.key();
        attestation.metal_type = metal_type;
        attestation.amount_oz = amount_oz;
        attestation.bar_count = bar_count;
        attestation.attestation_hash = attestation_hash;
        attestation.timestamp = Clock::get()?.unix_timestamp;
        attestation.signer_count = 1;
        attestation.threshold = 3;
        attestation.verified = false;
        attestation.bump = ctx.bumps.attestation;

        vault.last_attestation = attestation.timestamp;

        emit!(AttestationEvent {
            vault: vault.key(),
            metal_type,
            amount_oz,
            bar_count,
            signer: ctx.accounts.signer.key(),
            timestamp: attestation.timestamp,
        });

        Ok(())
    }

    /// Co-sign an existing attestation (towards 3/5 threshold)
    pub fn cosign_attestation(ctx: Context<CosignAttestation>) -> Result<()> {
        let attestation = &mut ctx.accounts.attestation;
        require!(!attestation.verified, RegistryError::AlreadyVerified);

        attestation.signer_count = attestation.signer_count.checked_add(1).unwrap();

        if attestation.signer_count >= attestation.threshold {
            attestation.verified = true;
            msg!("Attestation verified with {}/{} signers", attestation.signer_count, attestation.threshold);
        }

        Ok(())
    }

    /// Deactivate a vault (admin only)
    pub fn deactivate_vault(ctx: Context<VaultAdmin>) -> Result<()> {
        ctx.accounts.vault.active = false;
        msg!("Vault deactivated: {}", ctx.accounts.vault.name);
        Ok(())
    }

    // ── Provenance / Chain-of-Custody ───────────────────────────────
    // On-chain settle, off-chain decide: the chain stores only a stable
    // batch id, the current custodian, metal + quantity, and a SHA-256
    // hash of the full off-chain commercial payload (assay certs, LBMA
    // serials, shipping docs). This mirrors the sibling
    // Critical-mineral-traceability-solana AssetID / TransferEvent model.

    /// Record the provenance of a newly extracted / assayed metal batch.
    /// This is the genesis custody event: the batch enters the chain at
    /// its originating vault under a first custodian.
    pub fn record_provenance(
        ctx: Context<RecordProvenance>,
        batch_id: String,
        metal_type: u8,
        amount_oz: u64,
        origin: String,
        payload_hash: [u8; 32],
    ) -> Result<()> {
        require!(batch_id.len() <= 32, RegistryError::BatchIdTooLong);
        require!(origin.len() <= 64, RegistryError::OriginTooLong);
        require!(amount_oz > 0, RegistryError::InvalidAmount);
        require!(metal_type <= 3, RegistryError::InvalidMetalType);

        let vault = &ctx.accounts.vault;
        require!(vault.active, RegistryError::VaultInactive);

        let batch = &mut ctx.accounts.batch;
        batch.batch_id = batch_id.clone();
        batch.origin_vault = vault.key();
        batch.custodian = ctx.accounts.custodian.key();
        batch.metal_type = metal_type;
        batch.amount_oz = amount_oz;
        batch.origin = origin;
        batch.payload_hash = payload_hash;
        batch.transfer_count = 0;
        batch.created_at = Clock::get()?.unix_timestamp;
        batch.updated_at = batch.created_at;
        batch.bump = ctx.bumps.batch;

        emit!(ProvenanceEvent {
            batch_id,
            metal_type,
            amount_oz,
            custodian: batch.custodian,
            origin_vault: batch.origin_vault,
            payload_hash,
            timestamp: batch.created_at,
        });

        Ok(())
    }

    /// Transfer custody of a batch to a new holder (append-only custody
    /// hop). The current custodian must sign; the running `transfer_count`
    /// gives every batch a verifiable, monotonically increasing hop index.
    pub fn transfer_custody(
        ctx: Context<TransferCustody>,
        new_payload_hash: [u8; 32],
    ) -> Result<()> {
        let batch = &mut ctx.accounts.batch;

        require!(
            batch.custodian == ctx.accounts.current_custodian.key(),
            RegistryError::NotCurrentCustodian
        );

        let previous = batch.custodian;
        batch.custodian = ctx.accounts.new_custodian.key();
        batch.payload_hash = new_payload_hash;
        batch.transfer_count = batch.transfer_count.checked_add(1).unwrap();
        batch.updated_at = Clock::get()?.unix_timestamp;

        emit!(CustodyTransferEvent {
            batch_id: batch.batch_id.clone(),
            from: previous,
            to: batch.custodian,
            hop: batch.transfer_count,
            payload_hash: new_payload_hash,
            timestamp: batch.updated_at,
        });

        Ok(())
    }
}

// ── Accounts ────────────────────────────────────────────────────────

#[derive(Accounts)]
#[instruction(name: String)]
pub struct RegisterVault<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = 8 + VaultAccount::INIT_SPACE,
        seeds = [b"vault", name.as_bytes()],
        bump,
    )]
    pub vault: Account<'info, VaultAccount>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SubmitAttestation<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(mut)]
    pub vault: Account<'info, VaultAccount>,

    #[account(
        init,
        payer = signer,
        space = 8 + Attestation::INIT_SPACE,
        seeds = [b"attestation", vault.key().as_ref(), &Clock::get().unwrap().unix_timestamp.to_le_bytes()],
        bump,
    )]
    pub attestation: Account<'info, Attestation>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CosignAttestation<'info> {
    pub signer: Signer<'info>,

    #[account(mut)]
    pub attestation: Account<'info, Attestation>,
}

#[derive(Accounts)]
pub struct VaultAdmin<'info> {
    #[account(constraint = authority.key() == vault.authority @ RegistryError::Unauthorized)]
    pub authority: Signer<'info>,

    #[account(mut)]
    pub vault: Account<'info, VaultAccount>,
}

#[derive(Accounts)]
#[instruction(batch_id: String)]
pub struct RecordProvenance<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    /// The entity taking initial custody of the batch.
    /// CHECK: recorded as a key only; does not need to sign the genesis event.
    pub custodian: UncheckedAccount<'info>,

    pub vault: Account<'info, VaultAccount>,

    #[account(
        init,
        payer = payer,
        space = 8 + Batch::INIT_SPACE,
        seeds = [b"batch", batch_id.as_bytes()],
        bump,
    )]
    pub batch: Account<'info, Batch>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct TransferCustody<'info> {
    /// Must be the batch's current custodian.
    pub current_custodian: Signer<'info>,

    /// CHECK: recorded as the new custodian key only.
    pub new_custodian: UncheckedAccount<'info>,

    #[account(mut)]
    pub batch: Account<'info, Batch>,
}

// ── State ───────────────────────────────────────────────────────────

#[account]
#[derive(InitSpace)]
pub struct VaultAccount {
    pub authority: Pubkey,
    #[max_len(64)]
    pub name: String,
    #[max_len(64)]
    pub location: String,
    #[max_len(64)]
    pub custodian: String,
    pub active: bool,
    pub created_at: i64,
    pub last_attestation: i64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct Attestation {
    pub vault: Pubkey,
    pub signer: Pubkey,
    pub metal_type: u8,
    pub amount_oz: u64,
    pub bar_count: u32,
    pub attestation_hash: [u8; 32],
    pub timestamp: i64,
    pub signer_count: u8,
    pub threshold: u8,
    pub verified: bool,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct Batch {
    #[max_len(32)]
    pub batch_id: String,
    pub origin_vault: Pubkey,
    pub custodian: Pubkey,
    pub metal_type: u8,
    pub amount_oz: u64,
    #[max_len(64)]
    pub origin: String,
    pub payload_hash: [u8; 32],
    pub transfer_count: u32,
    pub created_at: i64,
    pub updated_at: i64,
    pub bump: u8,
}

// ── Events ──────────────────────────────────────────────────────────

#[event]
pub struct AttestationEvent {
    pub vault: Pubkey,
    pub metal_type: u8,
    pub amount_oz: u64,
    pub bar_count: u32,
    pub signer: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct ProvenanceEvent {
    pub batch_id: String,
    pub metal_type: u8,
    pub amount_oz: u64,
    pub custodian: Pubkey,
    pub origin_vault: Pubkey,
    pub payload_hash: [u8; 32],
    pub timestamp: i64,
}

#[event]
pub struct CustodyTransferEvent {
    pub batch_id: String,
    pub from: Pubkey,
    pub to: Pubkey,
    pub hop: u32,
    pub payload_hash: [u8; 32],
    pub timestamp: i64,
}

// ── Errors ──────────────────────────────────────────────────────────

#[error_code]
pub enum RegistryError {
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Vault name too long (max 64)")]
    NameTooLong,
    #[msg("Location too long (max 64)")]
    LocationTooLong,
    #[msg("Vault is inactive")]
    VaultInactive,
    #[msg("Attestation already verified")]
    AlreadyVerified,
    #[msg("Batch id too long (max 32)")]
    BatchIdTooLong,
    #[msg("Origin too long (max 64)")]
    OriginTooLong,
    #[msg("Invalid amount")]
    InvalidAmount,
    #[msg("Invalid metal type (0-3)")]
    InvalidMetalType,
    #[msg("Signer is not the current custodian")]
    NotCurrentCustodian,
}
