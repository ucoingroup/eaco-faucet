// EACO Faucet - Solana Program (Rust / Anchor Framework)
//
// This is a reference implementation of an on-chain faucet program.
// It uses PDA (Program Derived Address) to track claims and prevent
// duplicate claiming - no external database needed.
//
// Build & Deploy:
//   anchor build
//   anchor deploy --provider.cluster mainnet
//
// Security:
// - Claim records stored in PDA accounts (on-chain)
// - Authority-controlled faucet treasury
// - Configurable claim amount and cooldown

use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer, Mint};

// Program ID - replace with your actual program ID after build
declare_id!("EACoFaucet11111111111111111111111111111111111");

#[program]
pub mod eaco_faucet {
    use super::*;

    /// Initialize the faucet
    /// Sets up the faucet config with treasury and parameters
    pub fn initialize(
        ctx: Context<Initialize>,
        mint: Pubkey,
        min_claim: u64,
        max_claim: u64,
        cooldown_seconds: i64,
    ) -> Result<()> {
        let config = &mut ctx.accounts.config;
        config.authority = ctx.accounts.authority.key();
        config.mint = mint;
        config.treasury = ctx.accounts.treasury.key();
        config.min_claim = min_claim;
        config.max_claim = max_claim;
        config.cooldown_seconds = cooldown_seconds;
        config.total_distributed = 0;
        config.total_claimers = 0;
        config.bump = *ctx.bumps.get("config").unwrap();

        emit!(FaucetInitialized {
            authority: config.authority,
            mint: config.mint,
            treasury: config.treasury,
            min_claim,
            max_claim,
            cooldown_seconds,
        });

        Ok(())
    }

    /// Claim EACO tokens
    /// Each wallet can claim once per cooldown period
    pub fn claim(ctx: Context<Claim>, amount: u64) -> Result<()> {
        let config = &mut ctx.accounts.config;
        let clock = Clock::get()?;

        // Validate amount
        require!(
            amount >= config.min_claim && amount <= config.max_claim,
            FaucetError::InvalidAmount
        );

        // Check cooldown
        if ctx.accounts.claim_record.is_initialized {
            let elapsed = clock.unix_timestamp - ctx.accounts.claim_record.last_claim_time;
            require!(
                elapsed >= config.cooldown_seconds,
                FaucetError::CooldownNotElapsed
            );
        }

        // Check treasury has enough tokens
        require!(
            ctx.accounts.treasury_account.amount >= amount,
            FaucetError::InsufficientFunds
        );

        // Transfer tokens from treasury to claimer
        let cpi_accounts = Transfer {
            from: ctx.accounts.treasury_account.to_account_info(),
            to: ctx.accounts.claimer_token_account.to_account_info(),
            authority: ctx.accounts.treasury.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        token::transfer(CpiContext::new(cpi_program, cpi_accounts), amount)?;

        // Update claim record
        let claim_record = &mut ctx.accounts.claim_record;
        let is_new_claimer = !claim_record.is_initialized;
        claim_record.claimer = ctx.accounts.claimer.key();
        claim_record.last_claim_time = clock.unix_timestamp;
        claim_record.total_claimed += amount;
        claim_record.claim_count += 1;
        claim_record.is_initialized = true;

        // Update config stats (only count unique first-time claimers)
        config.total_distributed += amount;
        if is_new_claimer {
            config.total_claimers += 1;
        }

        emit!(ClaimEvent {
            claimer: ctx.accounts.claimer.key(),
            amount,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    /// Update faucet parameters (authority only)
    pub fn update_config(
        ctx: Context<UpdateConfig>,
        min_claim: Option<u64>,
        max_claim: Option<u64>,
        cooldown_seconds: Option<i64>,
    ) -> Result<()> {
        let config = &mut ctx.accounts.config;
        require!(
            ctx.accounts.authority.key() == config.authority,
            FaucetError::Unauthorized
        );

        if let Some(min) = min_claim {
            config.min_claim = min;
        }
        if let Some(max) = max_claim {
            config.max_claim = max;
        }
        if let Some(cd) = cooldown_seconds {
            config.cooldown_seconds = cd;
        }

        Ok(())
    }

    /// Get faucet stats (read-only, via account data)
    pub fn get_stats(ctx: Context<GetStats>) -> Result<FaucetStats> {
        let config = &ctx.accounts.config;
        Ok(FaucetStats {
            total_distributed: config.total_distributed,
            total_claimers: config.total_claimers,
            min_claim: config.min_claim,
            max_claim: config.max_claim,
            cooldown_seconds: config.cooldown_seconds,
        })
    }
}

// -- Accounts --

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 32 + 32 + 8 + 8 + 8 + 8 + 8 + 1,
        seeds = [b"config"],
        bump
    )]
    pub config: Account<'info, FaucetConfig>,

    #[account(mut)]
    pub authority: Signer<'info>,

    /// Treasury token account (holds EACO tokens to distribute)
    #[account(mut)]
    pub treasury: Account<'info, TokenAccount>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct Claim<'info> {
    #[account(mut, seeds = [b"config"], bump = config.bump)]
    pub config: Account<'info, FaucetConfig>,

    /// Claimer's wallet
    pub claimer: Signer<'info>,

    /// Claim record PDA - derived from claimer address
    /// This prevents duplicate claims
    #[account(
        init_if_needed,
        payer = claimer,
        space = 8 + 32 + 8 + 8 + 8 + 1,
        seeds = [b"claim", claimer.key().as_ref()],
        bump
    )]
    pub claim_record: Account<'info, ClaimRecord>,

    /// Treasury token account
    #[account(mut)]
    pub treasury_account: Account<'info, TokenAccount>,

    /// Claimer's token account (must be ATA for the EACO mint)
    #[account(mut)]
    pub claimer_token_account: Account<'info, TokenAccount>,

    /// Treasury authority (signs the transfer)
    #[account(mut)]
    pub treasury: Signer<'info>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct UpdateConfig<'info> {
    #[account(mut, seeds = [b"config"], bump = config.bump)]
    pub config: Account<'info, FaucetConfig>,

    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct GetStats<'info> {
    #[account(seeds = [b"config"], bump)]
    pub config: Account<'info, FaucetConfig>,
}

// -- Data Structures --

#[account]
pub struct FaucetConfig {
    pub authority: Pubkey,       // 32 bytes
    pub mint: Pubkey,            // 32 bytes
    pub treasury: Pubkey,        // 32 bytes
    pub min_claim: u64,          // 8 bytes
    pub max_claim: u64,          // 8 bytes
    pub cooldown_seconds: i64,   // 8 bytes
    pub total_distributed: u64,  // 8 bytes
    pub total_claimers: u64,     // 8 bytes
    pub bump: u8,                // 1 byte
}

#[account]
pub struct ClaimRecord {
    pub claimer: Pubkey,         // 32 bytes
    pub last_claim_time: i64,    // 8 bytes
    pub total_claimed: u64,      // 8 bytes
    pub claim_count: u64,        // 8 bytes
    pub is_initialized: bool,    // 1 byte
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct FaucetStats {
    pub total_distributed: u64,
    pub total_claimers: u64,
    pub min_claim: u64,
    pub max_claim: u64,
    pub cooldown_seconds: i64,
}

// -- Events --

#[event]
pub struct FaucetInitialized {
    pub authority: Pubkey,
    pub mint: Pubkey,
    pub treasury: Pubkey,
    pub min_claim: u64,
    pub max_claim: u64,
    pub cooldown_seconds: i64,
}

#[event]
pub struct ClaimEvent {
    pub claimer: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
}

// -- Errors --

#[error_code]
pub enum FaucetError {
    #[msg("Claim amount is outside the allowed range")]
    InvalidAmount,
    #[msg("Cooldown period has not elapsed since last claim")]
    CooldownNotElapsed,
    #[msg("Faucet treasury has insufficient funds")]
    InsufficientFunds,
    #[msg("Only the authority can perform this action")]
    Unauthorized,
}
