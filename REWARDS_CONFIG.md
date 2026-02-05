# Reward System Configuration

This document helps parents/guardians customize the reward system for their child's STAAR Quest game.

## Current Reward Milestones

The following rewards are built into the game and displayed on the Dashboard. You can modify these in the `frontend/src/components/Dashboard.js` file:

| Points | Default Reward | Icon |
|--------|---------------|------|
| 100 | 15 min extra screen time | 📱 |
| 250 | Special dessert | 🍰 |
| 500 | Movie night pick | 🎬 |
| 750 | Small toy or book | 🎁 |
| 1000 | Fun outing | 🎉 |
| 1500 | Big reward! | 🏆 |

## How to Customize Rewards

### Option 1: Edit Dashboard.js
Open `frontend/src/components/Dashboard.js` and find the `rewards` array (around line 17):

```javascript
const rewards = [
  { points: 100, reward: "Your custom reward", icon: "🎮" },
  { points: 250, reward: "Another reward", icon: "🍕" },
  // Add more as needed
];
```

### Option 2: Real-World Incentives

You can offer additional rewards based on achievements:

**Daily Streaks:**
- 3 days → Stay up 15 minutes later
- 7 days → Special breakfast choice
- 14 days → Friend sleepover
- 30 days → Special outing of their choice

**Badge Achievements:**
- First Victory → High five + verbal praise
- 10 Questions (Novice) → Sticker
- 50 Questions (Apprentice) → Small prize from prize box
- 100 Questions (Expert) → Book or toy ($10-15)
- Perfect Game → Ice cream treat

**Level Ups:**
- Level 5 → Choose dinner menu
- Level 10 → New school supplies
- Level 15 → Trip to local attraction

**Accuracy Milestones:**
- 80%+ average → Weekly allowance bonus
- 90%+ (Sharp Shooter badge) → Extra privilege

## Tracking Progress

Use the Dashboard stats to monitor:
- **Total Points**: Overall progress
- **Streak Days**: Consecutive days played
- **Accuracy %**: How well they're doing
- **Badges Earned**: Special achievements

## Tips for Success

1. **Be Consistent**: Deliver rewards promptly when milestones are reached
2. **Celebrate Small Wins**: Acknowledge daily streaks and badge earnings
3. **Balance Intrinsic/Extrinsic**: Mix material rewards with praise and privileges
4. **Set Clear Expectations**: Show them the reward list so they know what to work toward
5. **Make it Visual**: Print this list and post it near their study area

## Recommended Play Schedule

For best results with daily streaks:
- Set a consistent time each day (e.g., after homework, before dinner)
- Start with 15-20 minutes per session
- Gradually increase as they show interest
- Use the streak bonus as motivation to maintain consistency

## Badge Guide

Explain to your child what badges they can earn:

**Question Milestones:**
- 🎯 First Victory - First correct answer
- 📚 Novice Explorer - 10 questions
- 📖 Apprentice Scholar - 50 questions
- 🎓 Expert Learner - 100 questions
- 🏆 Master Student - 250 questions
- 👑 Legendary Scholar - 500 questions

**Streak Badges:**
- 🔥 3-Day Streak
- ⚡ Week Warrior (7 days)
- 💪 Two Week Champion (14 days)
- 🌟 Month Master (30 days)

**Special Badges:**
- 💯 Perfect Game - 100% accuracy in a game
- 🎯 Sharp Shooter - 90%+ accuracy over 10+ questions
- 🔢 Math Starter/Master - Subject-specific achievements
- 📖 Reading Starter/Master - Subject-specific achievements

---

Remember: The goal is to make learning fun and rewarding! Adjust the system based on what motivates your child best.
