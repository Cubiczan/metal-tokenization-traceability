use anchor_lang::prelude::*;

declare_id!("11111111111111111111111111111111");

#[program]
pub mod compliance_engine {
    use super::*;

    /// Register a wallet with KYC status
    pub fn register_identity(
        ctx: Context<RegisterIdentity>,
        jurisdiction: String,
        kyc_level: u8,
    ) -> Result<()> {
        require!(jurisdiction.len() <= 8, ComplianceError::JurisdictionTooLong);
        require!(kyc_level <= 3, ComplianceError::InvalidKycLevel);

        let identity = &mut ctx.accounts.identity;
        identity.wallet = ctx.accounts.wallet.key();
        identity.authority = ctx.accounts.authority.key();
        identity.jurisdiction = jurisdiction;
        identity.kyc_level = kyc_level;
        identity.approved = true;
        identity.frozen = false;
        identity.registered_at = Clock::get()?.unix_timestamp;
        identity.bump = ctx.bumps.identity;

        msg!("Identity registered for {}", ctx.accounts.wallet.key());
        Ok(())
    }

    /// Check if a transfer is allowed between two wallets
    pub fn check_transfer(
        ctx: Context<CheckTransfer>,
        _amount: u64,
    ) -> Result<()> {
        let sender = &ctx.accounts.sender_identity;
        let receiver = &ctx.accounts.receiver_identity;

        require!(sender.approved, ComplianceError::SenderNotApproved);
        require!(receiver.approved, ComplianceError::ReceiverNotApproved);
        require!(!sender.frozen, ComplianceError::AccountFrozen);
        require!(!receiver.frozen, ComplianceError::AccountFrozen);

        msg!("Transfer approved");
        Ok(())
    }

    /// Freeze a wallet (admin/compliance officer)
    pub fn freeze_account(ctx: Context<ComplianceAction>) -> Result<()> {
        ctx.accounts.identity.frozen = true;
        msg!("Account frozen: {}", ctx.accounts.identity.wallet);
        Ok(())
    }

    /// Unfreeze a wallet
    pub fn unfreeze_account(ctx: Context<ComplianceAction>) -> Result<()> {
        ctx.accounts.identity.frozen = false;
        msg!("Account unfrozen: {}", ctx.accounts.identity.wallet);
        Ok(())
    }

    /// Revoke KYC approval
    pub fn revoke_identity(ctx: Context<ComplianceAction>) -> Result<()> {
        ctx.accounts.identity.approved = false;
        msg!("Identity revoked: {}", ctx.accounts.identity.wallet);
        Ok(())
    }
}

// ── Accounts ────────────────────────────────────────────────────────

#[derive(Accounts)]
pub struct RegisterIdentity<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    /// CHECK: The wallet being registered (doesn't need to sign)
    pub wallet: UncheckedAccount<'info>,

    #[account(
        init,
        payer = authority,
        space = 8 + Identity::INIT_SPACE,
        seeds = [b"identity", wallet.key().as_ref()],
        bump,
    )]
    pub identity: Account<'info, Identity>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CheckTransfer<'info> {
    pub sender_identity: Account<'info, Identity>,
    pub receiver_identity: Account<'info, Identity>,
}

#[derive(Accounts)]
pub struct ComplianceAction<'info> {
    #[account(constraint = authority.key() == identity.authority @ ComplianceError::Unauthorized)]
    pub authority: Signer<'info>,

    #[account(mut)]
    pub identity: Account<'info, Identity>,
}

// ── State ───────────────────────────────────────────────────────────

#[account]
#[derive(InitSpace)]
pub struct Identity {
    pub wallet: Pubkey,
    pub authority: Pubkey,
    #[max_len(8)]
    pub jurisdiction: String,
    pub kyc_level: u8,
    pub approved: bool,
    pub frozen: bool,
    pub registered_at: i64,
    pub bump: u8,
}

// ── Errors ──────────────────────────────────────────────────────────

#[error_code]
pub enum ComplianceError {
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Jurisdiction code too long (max 8)")]
    JurisdictionTooLong,
    #[msg("Invalid KYC level (0-3)")]
    InvalidKycLevel,
    #[msg("Sender not KYC approved")]
    SenderNotApproved,
    #[msg("Receiver not KYC approved")]
    ReceiverNotApproved,
    #[msg("Account is frozen")]
    AccountFrozen,
}
