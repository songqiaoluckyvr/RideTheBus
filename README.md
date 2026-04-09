# RideTheBus
team game jam 2026
1. Overview
Game: Ride the Bus
Session Length: 20–60 seconds
Core Loop: Guess → Survive → Cash Out or Risk
A single-player card-based game where players progress through 4 probability-based stages, with increasing multipliers and optional cashout at each step.

2. Game Objective
Players bet an initial stake (e.g., $1) and attempt to correctly predict outcomes across 5 sequential stages to maximize payout.

3. Core Gameplay Flow
Step 0 — Bet Placement
Player places bet
Game initializes

Step 1 — Deck Generation
Full 52-card deck is shuffled using:
Deck order is fixed for the entire round

Step 2 — Player Decision Flow
Stage 1: Red or Black
Win → proceed / cashout
Lose → round ends

Stage 2: Higher or Lower
Compared to previous card
Ties = loss

Stage 3: Inside or Outside
Based on first two cards
Ties = loss 

Stage 4: Suit Guess
High-risk stage 
Players Predict the Suite of the 4th card 

Stage 5: Exact Card
Final All-In Stage 
Player selects the exact Card Value and Suit 

4. Payout Structure (Example)
Stage
Event
Multiplier
1
Correct color
1.8x
2
Correct H/L
3.5x
3
Correct I/O
9x
4
Correct suit
38x
5
Correct Value and Suit 
?


5. Cashout System
Player may cash out after any successful stage
UI shows:
Current value
Next potential value
Risk indicator

6. UI / UX Elements 
Web Based Game - no unity 
2D 
Needs to include a tutorial mode 
Ideally some nice animations upon the reveal of each card or some kind of build up of anticipation
Dopamine hit when players get one of their decisions right 
Player Balance + Cash out option based on each Decision + Button 
History Log 



7. ART/Audio/Visual Requirements 

Card back designs should be somewhat Blubo focused
Trophies - Bubo Designed 
Animation at the start to kickoff the game 
Animation to reset the game if a player loses
Art Styles that we can use as the theme for the game 
Audio 
Winning sounds  
Losing sounds 


8. Game Enhancements 

Unlock Achievements when you complete the 4th or 5th stage - Blubo Trophy 
Multiplayer - Max 4 players 
Decisions are done one after the other 


Option to add a Joker card system, allowing players to make progress a little easier, but each card must provide both a bonus and a penalty.

For example:
Joker “Vision of the future”: Allows the player to see the next X cards, but in counterpart these X cards are re-shuffle.
Joker “Call a friend”: Allows the player to ask a “friend” for help, the game displays the probabilities for each outcome (for example with Stage 2: 29% above, 69% below, 2% tie), but in counterpart the player must choose the probability with the highest percentage (random idea).


