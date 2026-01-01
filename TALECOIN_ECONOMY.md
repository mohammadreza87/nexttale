# TaleCoin Economy Model
## The Financial Engine of NextTale

---

## Vision Statement

TaleCoin (TC) is the native cryptocurrency that powers the NextTale creator economy. It enables:
- **Fair compensation** for creators
- **True ownership** through NFTs
- **Community governance** through voting
- **Sustainable growth** through aligned incentives

---

## Implementation Phases

### Phase A: Simulated Economy (Platform Currency)
**Timeline: Q2 2025**

TaleCoin exists as a platform-internal currency:
- Stored in PostgreSQL (not blockchain)
- 1 TC ≈ $0.01 USD (internal peg)
- Redeemable for USD at payout
- No external trading

### Phase B: Blockchain Migration (Polygon)
**Timeline: Q4 2025**

TaleCoin becomes real cryptocurrency:
- ERC-20 token on Polygon
- Tradeable on DEX (Uniswap)
- Wallet integration
- True decentralization

---

## Token Fundamentals

### Basic Information

| Property | Value |
|----------|-------|
| **Name** | TaleCoin |
| **Symbol** | TC |
| **Blockchain** | Polygon (Phase B) |
| **Token Standard** | ERC-20 |
| **Total Supply** | 1,000,000,000 TC |
| **Decimal Places** | 8 |
| **Initial Value** | $0.01 USD |

### Token Distribution

```
┌─────────────────────────────────────────────────────────────┐
│                    TOTAL SUPPLY: 1 BILLION TC               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ████████████████████████████████████████  40%             │
│   Creator Rewards Pool (400,000,000 TC)                     │
│   → Distributed to creators over 10 years                   │
│                                                             │
│   █████████████████████████  25%                            │
│   Platform Treasury (250,000,000 TC)                        │
│   → Operational costs, liquidity, partnerships              │
│                                                             │
│   ███████████████  15%                                      │
│   Team & Advisors (150,000,000 TC)                          │
│   → 4-year vesting, 1-year cliff                            │
│                                                             │
│   ██████████  10%                                           │
│   Investors (100,000,000 TC)                                │
│   → 2-year vesting, 6-month cliff                           │
│                                                             │
│   █████  5%                                                 │
│   Community Airdrop (50,000,000 TC)                         │
│   → Early adopters, beta testers, founding creators         │
│                                                             │
│   █████  5%                                                 │
│   Liquidity Pool (50,000,000 TC)                            │
│   → DEX liquidity for trading                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Earning TaleCoin

### For Creators

| Action | TC Earned | Notes |
|--------|-----------|-------|
| **Content Views** | 0.1 TC per view | Unique views only |
| **Content Plays** | 0.2 TC per play | Games/interactive |
| **Likes Received** | 0.5 TC per like | From unique users |
| **Comments Received** | 0.3 TC per comment | Quality engagement |
| **Content Completion** | 1 TC per completion | Story/game finished |
| **Tips Received** | 100% of tip | Direct creator support |
| **Content Sales** | 80% of price | Premium content |
| **NFT Sales** | 80% primary, 10% royalty | Perpetual earnings |
| **Ad Revenue** | 55% of ad income | Video/display ads |

**Example: Popular Creator Monthly Earnings**
```
Content: 1 game with 50,000 plays
- 50,000 plays × 0.2 TC = 10,000 TC
- 5,000 likes × 0.5 TC = 2,500 TC
- 1,000 comments × 0.3 TC = 300 TC
- 2,000 completions × 1 TC = 2,000 TC
- Tips received = 500 TC
- Ad revenue (55% of $200) = ~2,000 TC

TOTAL: ~17,300 TC = ~$173/month
```

### For Users (Non-Creators)

| Action | TC Earned | Daily Limit |
|--------|-----------|-------------|
| Daily Login | 5 TC | 5 TC |
| Watch Reward Ad | 2 TC | 20 TC |
| Complete Quest | 10-100 TC | Varies |
| Refer New User | 500 TC | Unlimited |
| Report Violation | 50 TC | 5/day |
| Curate Content | 1 TC | 50 TC |

---

## Spending TaleCoin

### Platform Features

| Use Case | Cost | Notes |
|----------|------|-------|
| **Tip Creator** | 1+ TC | Any amount |
| **Super Like** | 10 TC | Boosted visibility |
| **Boost Content** | 50-500 TC | Algorithm promotion |
| **Ad-Free Day** | 100 TC | 24 hours no ads |
| **Ad-Free Month** | 2,000 TC | Cheaper than daily |
| **Premium Content** | Varies | Set by creator |
| **NFT Purchase** | Varies | Market price |

### Creator Tools

| Feature | Cost | Notes |
|---------|------|-------|
| **Mint NFT** | 50 TC + gas | Simulated gas in Phase A |
| **Custom AI Model** | 1,000 TC | Train on your style |
| **Priority Generation** | 25 TC | Skip queue |
| **Advanced Analytics** | 500 TC/mo | Deep insights |
| **Collaboration Room** | 200 TC/mo | Multi-creator projects |

### Future Features (Phase B)

| Feature | Cost | Notes |
|---------|------|-------|
| **Governance Vote** | Stake required | 1 TC = 1 vote |
| **Creator Fund Pool** | Stake 10,000 TC | Earn fund distributions |
| **NFT Staking** | Lock NFT | Earn TC rewards |
| **DEX Swap** | 0.3% fee | TC ↔ MATIC/ETH/USDC |

---

## NFT Economy

### Minting Process

```
Creator Creates Content
        ↓
Reaches Level 35 + 10 sales
        ↓
Selects Content to Mint
        ↓
Chooses Edition Size:
├── 1 (Unique)
├── 10 (Limited)
├── 100 (Scarce)
└── Unlimited (Open)
        ↓
Sets Price in TaleCoin
        ↓
Pays Minting Fee (50 TC)
        ↓
NFT Listed in Marketplace
```

### NFT Fee Structure

| Transaction | Creator Gets | Platform Gets | Royalty Pool |
|-------------|--------------|---------------|--------------|
| Primary Sale | 80% | 20% | - |
| Secondary Sale | 10% (royalty) | 10% | - |
| Auction Sale | 75% | 25% | - |

### NFT Benefits

**For Owners:**
- Exclusive access to content
- Resale rights
- Display in profile gallery
- Governance weight boost
- Early access to creator's new work

**For Creators:**
- 10% perpetual royalties on ALL secondary sales
- Verified creator badge
- Priority support
- Higher revenue share (60% vs 55%)
- Access to exclusive creator events

---

## Advertising Economy

### Ad Types & Revenue

| Ad Type | CPM/CPC | Creator Share | Platform Share |
|---------|---------|---------------|----------------|
| Video Interstitial | $8 CPM | 55% | 45% |
| In-Content Display | $0.25 CPC | 55% | 45% |
| Banner Ads | $3 CPM | 50% | 50% |
| Reward Ads | $15 CPM | 70% | 30% |
| Sponsored Content | Negotiated | 60% | 40% |

### Reward Ads Flow

```
User Watches 30-second Ad
        ↓
Advertiser Pays $15 CPM
(1000 views = $15)
        ↓
Per View = $0.015
        ↓
70% to User = $0.0105 = ~1 TC
30% to Platform = $0.0045
        ↓
User Receives 1-2 TC
```

### Ad-Free Options

| Option | Cost | Duration |
|--------|------|----------|
| Watch 5 Reward Ads | Free (earn TC) | 1 hour |
| Pay TaleCoin | 100 TC | 1 day |
| Pay TaleCoin | 2,000 TC | 1 month |
| Pro Subscription | $20/mo | Permanent |

---

## Revenue Sharing Model

### Standard Creator Split

```
GROSS AD REVENUE: $100
        ↓
├── Creator: $55 (55%)
├── Platform: $35 (35%)
└── Creator Fund: $10 (10%)
```

### Boosted Split (Top 1% Creators)

```
GROSS AD REVENUE: $100
        ↓
├── Creator: $65 (65%)
├── Platform: $25 (25%)
└── Creator Fund: $10 (10%)
```

### Performance Bonuses

| Achievement | Bonus |
|-------------|-------|
| Viral Content (10K+ views) | +5% revenue share |
| High Retention (>80% completion) | +5% revenue share |
| Trending Hashtag | +3% revenue share |
| Weekly Top 10 | +$50 bonus |
| Monthly Top Creator | +$500 bonus |

---

## Creator Fund

### Fund Allocation

10% of all platform revenue goes to the Creator Fund:
- Distributed monthly
- Based on engagement metrics
- Rewards emerging creators
- Supports diverse content

### Fund Distribution

```
Monthly Creator Fund Pool: $50,000 (example)
        ↓
├── Top 100 Creators: $30,000 (60%)
│   └── Based on engagement score
├── Rising Stars: $10,000 (20%)
│   └── High growth creators
├── Niche Excellence: $5,000 (10%)
│   └── Best in category
└── Community Choice: $5,000 (10%)
    └── User-voted awards
```

---

## Payout System

### Minimum Payout Thresholds

| Currency | Minimum | Processing Fee |
|----------|---------|----------------|
| TaleCoin (internal) | No minimum | Free |
| USD (PayPal) | $10 | $0.50 |
| USD (Bank) | $50 | $2.00 |
| USDC (Phase B) | 100 TC | Gas only |
| ETH (Phase B) | 1,000 TC | Gas only |

### Payout Schedule

| Tier | Frequency | Notes |
|------|-----------|-------|
| Free User | Monthly | 15th of month |
| Pro Creator | Weekly | Every Friday |
| Max Creator | Daily | On demand |

---

## Anti-Abuse Mechanisms

### Bot Prevention

| Mechanism | Description |
|-----------|-------------|
| Rate Limiting | Max 1000 views/day from same IP |
| Behavioral Analysis | AI detects bot patterns |
| Device Fingerprinting | Unique device tracking |
| CAPTCHA Challenges | Suspicious activity triggers |
| Stake Requirements | Tipping requires balance |

### Fraud Detection

```
Suspicious Activity Detected
        ↓
├── Low Risk: Warning
├── Medium Risk: Earnings Frozen
├── High Risk: Account Review
└── Confirmed Fraud: Ban + Forfeit
```

### Earning Caps

| Action | Daily Cap | Notes |
|--------|-----------|-------|
| Views Income | 10,000 TC | Prevents bot abuse |
| Reward Ads | 20 TC | Max 10 ads/day |
| Referrals | 5,000 TC | Max 10 refs/day |
| Curating | 50 TC | Quality checked |

---

## Tokenomics Simulation

### Year 1 Projections (Phase A - Simulated)

| Metric | Q1 | Q2 | Q3 | Q4 |
|--------|----|----|----|----|
| MAU | 10K | 30K | 75K | 150K |
| TC Distributed | 1M | 5M | 15M | 40M |
| TC Spent | 0.2M | 1M | 4M | 12M |
| Net Circulation | 0.8M | 4M | 11M | 28M |

### Year 2 Projections (Phase B - Blockchain)

| Metric | Q1 | Q2 | Q3 | Q4 |
|--------|----|----|----|----|
| MAU | 250K | 400K | 600K | 1M |
| TC Distributed | 60M | 80M | 100M | 150M |
| TC Spent | 20M | 30M | 45M | 75M |
| TC Staked | 10M | 25M | 50M | 100M |
| Price Estimate | $0.015 | $0.025 | $0.04 | $0.08 |

### Token Value Drivers

**Demand Drivers (Price Up):**
- More creators → more spending on tools
- NFT minting requires TC
- Governance staking
- Ad-free purchases
- Premium content
- Limited supply release

**Supply Drivers (Price Stability):**
- Slow emission schedule
- Burning mechanisms (5% of platform fees)
- Staking lockups
- Long-term vesting

---

## Governance (Phase B)

### Voting Power

```
Voting Weight = (TC Holdings) + (NFT Bonus) + (Level Bonus)

Where:
- TC Holdings: 1 TC = 1 vote
- NFT Bonus: Owning NFTs = +10% per NFT (max 100%)
- Level Bonus: Creator level × 100 votes
```

### Governance Topics

| Category | Examples |
|----------|----------|
| Economics | Fee changes, revenue splits |
| Features | New feature priorities |
| Moderation | Content policy updates |
| Partnerships | Major deals approval |
| Fund | Creator fund allocation |

### Proposal Process

```
1. Create Proposal (requires 100,000 TC stake)
2. Discussion Period (7 days)
3. Voting Period (7 days)
4. Quorum Check (10% of circulating supply)
5. Execution (if passed with >50% approval)
```

---

## Technical Implementation

### Phase A: Database Schema

```sql
-- TaleCoin ledger
CREATE TABLE talecoin_balances (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) UNIQUE,
  available_balance DECIMAL(18,8) DEFAULT 0,
  pending_balance DECIMAL(18,8) DEFAULT 0,
  total_earned DECIMAL(18,8) DEFAULT 0,
  total_spent DECIMAL(18,8) DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Transaction history
CREATE TABLE talecoin_transactions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  type TEXT NOT NULL, -- 'earn', 'spend', 'tip', 'payout'
  amount DECIMAL(18,8) NOT NULL,
  description TEXT,
  reference_type TEXT, -- 'content_view', 'ad_revenue', 'nft_sale'
  reference_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Payout requests
CREATE TABLE payout_requests (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  amount_tc DECIMAL(18,8) NOT NULL,
  amount_usd DECIMAL(10,2),
  payout_method TEXT, -- 'paypal', 'bank', 'crypto'
  status TEXT DEFAULT 'pending',
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_tc_balances_user ON talecoin_balances(user_id);
CREATE INDEX idx_tc_transactions_user ON talecoin_transactions(user_id);
CREATE INDEX idx_tc_transactions_created ON talecoin_transactions(created_at);
```

### Phase B: Smart Contracts

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TaleCoin is ERC20, Ownable {
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10**8;
    uint256 public constant CREATOR_POOL = 400_000_000 * 10**8;

    mapping(address => uint256) public creatorRewards;

    constructor() ERC20("TaleCoin", "TC") {
        // Mint initial supply to treasury
        _mint(msg.sender, MAX_SUPPLY - CREATOR_POOL);
    }

    function distributeCreatorReward(
        address creator,
        uint256 amount
    ) external onlyOwner {
        require(creatorRewards[creator] + amount <= CREATOR_POOL, "Pool exhausted");
        creatorRewards[creator] += amount;
        _mint(creator, amount);
    }

    function decimals() public pure override returns (uint8) {
        return 8;
    }
}
```

---

## Risk Mitigation

### Regulatory Compliance

| Risk | Mitigation |
|------|------------|
| Securities Law | Utility token, not investment |
| Money Transmission | Licensed payment processor |
| Tax Reporting | 1099 for US creators >$600 |
| International | Geo-restrictions where needed |

### Economic Risks

| Risk | Mitigation |
|------|------------|
| Token Dump | Vesting schedules, lockups |
| Bot Inflation | Rate limits, verification |
| Market Crash | Fiat fallback, utility focus |
| Whale Manipulation | Max voting caps, time-locks |

---

## Success Metrics

### Phase A Targets

| Metric | 6 Month | 12 Month |
|--------|---------|----------|
| TC Distributed | 10M | 50M |
| Active Earners | 5,000 | 25,000 |
| Avg Creator Earnings | $20/mo | $50/mo |
| Payout Volume | $50K | $500K |

### Phase B Targets

| Metric | 18 Month | 24 Month |
|--------|----------|----------|
| Token Price | $0.05 | $0.10 |
| Market Cap | $20M | $100M |
| Daily Volume | $100K | $1M |
| Staking Rate | 20% | 40% |

---

## Conclusion

TaleCoin creates a sustainable creator economy where:

1. **Creators earn fairly** - 55%+ revenue share, perpetual royalties
2. **Users are rewarded** - Engagement earns value
3. **Ownership is real** - NFTs provide true digital ownership
4. **Community governs** - Token holders shape the platform

This is not speculation. This is **creative infrastructure**.

---

*Document Version: 1.0*
*Last Updated: January 2025*
*Economics Team: NextTale*
