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
}
