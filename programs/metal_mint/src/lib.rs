use anchor_lang::prelude::*;
use anchor_spl::token_2022::{self, Token2022, MintTo, Burn};
use anchor_spl::token_interface::{Mint, TokenAccount};

declare_id!("11111111111111111111111111111111");

#[program]
pub mod metal_mint {
    use super::*;

    /// Initialize a new metal token mint (Token-2022)
    pub fn initialize_mint(
        ctx: Context<InitializeMint>,
        metal_type: MetalType,
        decimals: u8,
    ) -> Result<()> {
        let config = &mut ctx.accounts.mint_config;
        config.authority = ctx.accounts.authority.key();
        config.metal_type = metal_type;
        config.mint = ctx.accounts.mint.key();
        config.total_minted = 0;
        config.total_burned = 0;
        config.paused = false;
        config.bump = ctx.bumps.mint_config;

        msg!("Initialized {:?} mint: {}", metal_type, ctx.accounts.mint.key());
        Ok(())
    }

    /// Mint new metal-backed tokens (requires reserve attestation)
    pub fn mint_tokens(
        ctx: Context<MintTokens>,
        amount: u64,
        attestation_id: String,
    ) -> Result<()> {
        {
            let config = &ctx.accounts.mint_config;
            require!(!config.paused, MetalError::MintPaused);
        }
        require!(amount > 0, MetalError::InvalidAmount);
        require!(attestation_id.len() <= 64, MetalError::AttestationTooLong);

        // Capture PDA seed material before borrowing accounts for the CPI.
        let config_mint = ctx.accounts.mint_config.mint;
        let config_bump = ctx.accounts.mint_config.bump;

        // Mint tokens via Token-2022
        let seeds = &[
            b"mint_config".as_ref(),
            config_mint.as_ref(),
            &[config_bump],
        ];
        let signer_seeds = &[&seeds[..]];

        let cpi_accounts = MintTo {
            mint: ctx.accounts.mint.to_account_info(),
            to: ctx.accounts.destination.to_account_info(),
            authority: ctx.accounts.mint_config.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);
        token_2022::mint_to(cpi_ctx, amount)?;

        let config = &mut ctx.accounts.mint_config;
        config.total_minted = config.total_minted.checked_add(amount).unwrap();

        emit!(MintEvent {
            mint: config.mint,
            metal_type: config.metal_type,
            amount,
            recipient: ctx.accounts.destination.key(),
            attestation_id,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    /// Redeem (burn) tokens to initiate physical metal delivery
    pub fn redeem_tokens(
        ctx: Context<RedeemTokens>,
        amount: u64,
        delivery_vault: Pubkey,
    ) -> Result<()> {
        let config = &mut ctx.accounts.mint_config;
        require!(!config.paused, MetalError::MintPaused);
        require!(amount > 0, MetalError::InvalidAmount);

        let cpi_accounts = Burn {
            mint: ctx.accounts.mint.to_account_info(),
            from: ctx.accounts.source.to_account_info(),
            authority: ctx.accounts.owner.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token_2022::burn(cpi_ctx, amount)?;

        config.total_burned = config.total_burned.checked_add(amount).unwrap();

        emit!(RedeemEvent {
            mint: config.mint,
            metal_type: config.metal_type,
            amount,
            redeemer: ctx.accounts.owner.key(),
            delivery_vault,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    /// Emergency pause/unpause minting
    pub fn set_paused(ctx: Context<AdminAction>, paused: bool) -> Result<()> {
        let config = &mut ctx.accounts.mint_config;
        config.paused = paused;
        msg!("Mint {} paused: {}", config.mint, paused);
        Ok(())
    }
}

// ── Accounts ────────────────────────────────────────────────────────

#[derive(Accounts)]
pub struct InitializeMint<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = 8 + MintConfig::INIT_SPACE,
        seeds = [b"mint_config", mint.key().as_ref()],
        bump,
    )]
    pub mint_config: Account<'info, MintConfig>,

    /// The Token-2022 mint account (created externally via CLI or script)
    pub mint: InterfaceAccount<'info, Mint>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct MintTokens<'info> {
    #[account(
        constraint = authority.key() == mint_config.authority @ MetalError::Unauthorized
    )]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [b"mint_config", mint.key().as_ref()],
        bump = mint_config.bump,
    )]
    pub mint_config: Account<'info, MintConfig>,

    #[account(mut)]
    pub mint: InterfaceAccount<'info, Mint>,

    #[account(mut)]
    pub destination: InterfaceAccount<'info, TokenAccount>,

    pub token_program: Program<'info, Token2022>,
}

#[derive(Accounts)]
pub struct RedeemTokens<'info> {
    pub owner: Signer<'info>,

    #[account(
        mut,
        seeds = [b"mint_config", mint.key().as_ref()],
        bump = mint_config.bump,
    )]
    pub mint_config: Account<'info, MintConfig>,

    #[account(mut)]
    pub mint: InterfaceAccount<'info, Mint>,

    #[account(mut, constraint = source.owner == owner.key())]
    pub source: InterfaceAccount<'info, TokenAccount>,

    pub token_program: Program<'info, Token2022>,
}

#[derive(Accounts)]
pub struct AdminAction<'info> {
    #[account(constraint = authority.key() == mint_config.authority @ MetalError::Unauthorized)]
    pub authority: Signer<'info>,

    #[account(mut)]
    pub mint_config: Account<'info, MintConfig>,
}

// ── State ───────────────────────────────────────────────────────────

#[account]
#[derive(InitSpace)]
pub struct MintConfig {
    pub authority: Pubkey,
    pub mint: Pubkey,
    pub metal_type: MetalType,
    pub total_minted: u64,
    pub total_burned: u64,
    pub paused: bool,
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, PartialEq, InitSpace)]
pub enum MetalType {
    Gold,
    Silver,
    Platinum,
    Palladium,
}

// ── Events ──────────────────────────────────────────────────────────

#[event]
pub struct MintEvent {
    pub mint: Pubkey,
    pub metal_type: MetalType,
    pub amount: u64,
    pub recipient: Pubkey,
    pub attestation_id: String,
    pub timestamp: i64,
}

#[event]
pub struct RedeemEvent {
    pub mint: Pubkey,
    pub metal_type: MetalType,
    pub amount: u64,
    pub redeemer: Pubkey,
    pub delivery_vault: Pubkey,
    pub timestamp: i64,
}

// ── Errors ──────────────────────────────────────────────────────────

#[error_code]
pub enum MetalError {
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Minting is paused")]
    MintPaused,
    #[msg("Invalid amount")]
    InvalidAmount,
    #[msg("Attestation ID too long")]
    AttestationTooLong,
}
