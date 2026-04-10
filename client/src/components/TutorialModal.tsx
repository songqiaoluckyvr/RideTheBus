import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface TutorialPage {
  title: string
  content: string[]
}

const SECTIONS: { heading: string; pages: TutorialPage[] }[] = [
  {
    heading: 'Basic Rules',
    pages: [
      {
        title: 'How to Play',
        content: [
          'Ride the Bus is a card guessing game with 5 stages.',
          'Place a bet, then try to guess correctly at each stage to multiply your winnings.',
          'If you guess wrong at any stage, you lose your bet.',
        ],
      },
      {
        title: 'The 5 Stages',
        content: [
          'Stage 1 — Red or Black: Guess the color of the next card.',
          'Stage 2 — Higher or Lower: Will the next card be higher or lower than the previous one?',
          'Stage 3 — Inside or Outside: Will the next card fall between or outside the two previous cards?',
          'Stage 4 — Suit: Guess the suit of the next card (hearts, diamonds, clubs, spades).',
          'Stage 5 — Higher or Lower: One last guess to win the jackpot!',
        ],
      },
      {
        title: 'Cash Out or Keep Going',
        content: [
          'After clearing a stage, you can cash out your current winnings or keep going for a bigger multiplier.',
          'Each stage has a higher multiplier, but the risk increases.',
          'If you clear all 5 stages, you win the maximum payout!',
        ],
      },
    ],
  },
  {
    heading: 'Solo — Normal',
    pages: [
      {
        title: 'Normal Mode',
        content: [
          'No timer — take your time to make each decision.',
          'Multipliers: x1.9 → x2.6 → x4 → x15 → x723',
          'Perfect for learning the game and building your balance at your own pace.',
        ],
      },
    ],
  },
  {
    heading: 'Solo — Hard',
    pages: [
      {
        title: 'Hard Mode',
        content: [
          'You have 45 seconds to clear all 5 stages.',
          'The timer does NOT reset between stages — it keeps running, even during the cash out decision.',
          'There is a 1-second grace period at the start of the game only.',
        ],
      },
      {
        title: 'Multiplier Degradation',
        content: [
          'Multipliers start higher than Normal mode: x2.9 → x4.0 → x6.1 → x23 → x1100',
          'But they degrade over time as the timer counts down.',
          'At 1 second remaining, multipliers drop to 26% of their initial value.',
          'The faster you play, the more you earn!',
          'If the timer hits 0, the round is forfeited and you lose your bet.',
        ],
      },
    ],
  },
  {
    heading: 'Tournament',
    pages: [
      {
        title: 'Tournament Mode',
        content: [
          'Multiplayer mode for 2–4 players.',
          'Each player buys in with the same amount, and balances start equal.',
          'The tournament lasts 5 rounds. At the start of each round, every player places a bet.',
          'You can skip a round if you want to play it safe.',
        ],
      },
      {
        title: 'Timer & Prize',
        content: [
          '30 seconds per stage. If time runs out, the round is forfeited.',
          'Multipliers are fixed (no degradation): x1.9 → x2.6 → x4 → x15 → x723',
          'The prize pool = total buy-ins × a random 1–4× multiplier.',
          'After 5 rounds, the player with the highest balance wins the prize pool.',
          'In case of a tie, winners split the prize equally.',
        ],
      },
    ],
  },
  {
    heading: 'Battle Royale',
    pages: [
      {
        title: 'Battle Royale Mode',
        content: [
          'Multiplayer mode for 2–10 players.',
          'No round limit — the game continues until only one player has money left (or everyone goes broke).',
          'You cannot skip rounds. If the betting timer expires, 50% of your max bet is placed automatically.',
        ],
      },
      {
        title: 'Degrading Multipliers',
        content: [
          'Same base multipliers: x1.9 → x2.6 → x4 → x15 → x723',
          'But multipliers degrade over time, similar to Hard mode.',
          'The floor is 50% of the original value (profit portion halved).',
          '30 seconds per stage with a 1-second grace period.',
          'Last player standing wins the prize pool!',
        ],
      },
    ],
  },
]

// Flatten all pages with their section heading + part number
const ALL_PAGES = SECTIONS.flatMap((s) =>
  s.pages.map((p, i) => ({
    ...p,
    section: s.pages.length > 1 ? `${s.heading} (Part ${i + 1})` : s.heading,
  })),
)

interface Props {
  open: boolean
  onClose: () => void
}

export function TutorialModal({ open, onClose }: Props) {
  const [page, setPage] = useState(0)

  const current = ALL_PAGES[page]
  const total = ALL_PAGES.length

  const prev = () => setPage((p) => Math.max(0, p - 1))
  const next = () => setPage((p) => Math.min(total - 1, p + 1))

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="tutorial-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          onClick={onClose}
        >
          <div className="fixed inset-0 bg-black/70" />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="relative bg-[#1a1a2e] border border-white/15 rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <div>
                <p className="text-white/30 text-xs uppercase tracking-widest">{current.section}</p>
                <h2 className="text-gold font-display font-bold text-xl">{current.title}</h2>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-white/40 hover:text-white/70 hover:bg-white/10 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-5 pb-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={page}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.15 }}
                  className="flex flex-col gap-3"
                >
                  {current.content.map((line, i) => (
                    <p key={i} className="text-white/70 text-sm leading-relaxed">{line}</p>
                  ))}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer — pagination */}
            <div className="flex items-center justify-between px-5 py-4 border-t border-white/10">
              <button
                onClick={prev}
                disabled={page === 0}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  page === 0 ? 'text-white/15 cursor-not-allowed' : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                Previous
              </button>
              <span className="text-white/30 text-xs tabular-nums">{page + 1} / {total}</span>
              {page < total - 1 ? (
                <button
                  onClick={next}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-gold hover:bg-gold/10 transition-colors"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={() => { setPage(0); onClose() }}
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-gold text-black hover:bg-gold/90 transition-colors"
                >
                  Got it!
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
