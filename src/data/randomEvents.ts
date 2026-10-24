import { GameState, GameEvent, Club } from '../types';
import { formatMoney, getLeagueScaledFans, getLeagueScaledVal, isReserveClub, getClubCatchmentCeiling } from './gameConstants';
import { ALL_CLUBS } from "./clubsData";

export const generateRandomEvent = (currentState: GameState): GameEvent | null => {
    const tier = currentState.club.tier;
    const clubCountry = currentState.club.country || 'GER';

    const events: GameEvent[] = [

    {
      type: 'cup_fever',
      title: { en: 'CUP FEVER', de: 'POKALFIEBER' },
      desc: { 
        en: `The dressing room is electric ahead of the upcoming Cup knockout stage! How should we prepare for the cup clash?`,
        de: `Die Kabine brennt vor Motivation vor der anstehenden Pokal-K.o.-Runde! Wie bereiten wir die Mannschaft vor?`
      },
      opt1: { 
        title: { en: 'Intensive Cup Drills & Video Analysis' + (((currentState.managerSkills || []).includes('tactical_mastermind') || (currentState.managerSkills || []).includes('tactical_genius')) ? ' (Tactical Genius: +15% Win Rate)' : ''), de: 'Intensive Pokal-Taktik & Videoanalyse' + (((currentState.managerSkills || []).includes('tactical_mastermind') || (currentState.managerSkills || []).includes('tactical_genius')) ? ' (Taktisches Genie: +15% Siegchance)' : '') },
        goodPct: ((currentState.managerSkills || []).includes('tactical_mastermind') || (currentState.managerSkills || []).includes('tactical_genius')) ? 85 : 70,
        goodTxt: { en: 'Tactical breakthrough! Squad primed for the cup (+1 OVR, +10 Morale)', de: 'Taktischer Durchbruch! Mannschaft bereit für den Pokal (+1 OVR, +10 Moral)' },
        badPct: ((currentState.managerSkills || []).includes('tactical_mastermind') || (currentState.managerSkills || []).includes('tactical_genius')) ? 15 : 30,
        badTxt: { en: 'Minor overtraining fatigue (-5 Morale)', de: 'Leichte Übermüdung durch Extratraining (-5 Moral)' }
      },
      opt2: { 
        title: { en: 'Maintain Standard League Routine', de: 'Normalen Liga-Rhythmus beibehalten' },
        goodPct: 85,
        goodTxt: { en: 'Squad stays composed and sharp (+5 Morale, +2 Rep)', de: 'Mannschaft bleibt abgeklärt und fokussiert (+5 Moral, +2 Rep)' },
        badPct: 15,
        badTxt: { en: 'Fans wanted more cup passion (-2 Rep)', de: 'Fans vermissen Pokal-Leidenschaft (-2 Rep)' }
      },
      extraData: {
        opt1Good: { ovr: 1, morale: 10 },
        opt1Bad: { morale: -5 },
        opt2Good: { morale: 5, rep: 2 },
        opt2Bad: { rep: -2 }
      }
    },
    {
      type: 'decision_day',
      title: { en: 'OPENING DAY TENSION', de: 'SPANNUNG ZUM SAISONAUFTAKT' },
      desc: { 
        en: "It's the opening matchday of the new campaign and the stakes are high. The tension is palpable in the dressing room.",
        de: "Erster Spieltag der neuen Saison! Die Erwartungen sind hoch und die Spannung in der Kabine ist greifbar."
      },
      opt1: { 
        title: { en: 'Fiery motivational speech', de: 'Feurige Motivationsrede' },
        goodPct: 50,
        goodTxt: { en: 'The team played out of their skins! (+2 OVR, +10 Morale)', de: 'Das Team ist über sich hinausgewachsen! (+2 OVR, +10 Moral)' },
        badPct: 50,
        badTxt: { en: 'Pressure was too much, players crumbled (-2 OVR, -15 Morale)', de: 'Der Druck war zu hoch, Spieler sind eingebrochen (-2 OVR, -15 Moral)' }
      },
      opt2: { 
        title: { en: 'Keep them calm and relaxed', de: 'Ruhig und entspannt bleiben' },
        goodPct: 80,
        goodTxt: { en: 'Professional performance secured the result (+1 OVR, +5 Morale)', de: 'Professionelle Leistung sicherte das Ergebnis (+1 OVR, +5 Moral)' },
        badPct: 20,
        badTxt: { en: 'They were too casual and dropped points (-1 OVR)', de: 'Sie waren zu lässig und ließen Punkte liegen (-1 OVR)' }
      },
      extraData: {
        opt1Good: { ovr: 2, morale: 10 },
        opt1Bad: { ovr: -2, morale: -15 },
        opt2Good: { ovr: 1, morale: 5 },
        opt2Bad: { ovr: -1 }
      }
    },

    {
      type: 'handball_resin_ban',
      title: { en: 'RESIN BAN' },
      desc: { 
        en: "The league banned your team's preferred brand of sticky resin (Klister). Players are complaining about losing grip on the ball."
      },
      opt1: { 
        title: { en: 'Buy approved resin' }, 
        goodPct: 100, 
        goodTxt: { en: `Grip restored safely (-${formatMoney(getLeagueScaledVal(tier, 500, clubCountry))} Budget)` } 
      },
      opt2: { 
        title: { en: 'Smuggle the old resin' }, 
        goodPct: 40, 
        goodTxt: { en: 'Perfect grip achieved (+1 OVR, +5 Morale)' },
        badPct: 60,
        badTxt: { en: 'Caught by the referees! (-2 Reputation, -10 Morale)' }
      },
      extraData: {
        opt1Cost: getLeagueScaledVal(tier, 500, clubCountry),
        opt1Good: {},
        opt2Good: { ovr: 1, morale: 5 },
        opt2Bad: { rep: -2, morale: -10 }
      }
    },
    {
      type: 'handball_floor_burn',
      title: { en: 'NASTY FLOOR BURN' },
      desc: { 
        en: "Your star winger dove for a loose ball and got a massive friction burn sliding across the indoor court."
      },
      opt1: { 
        title: { en: 'Send to specialist clinic' }, 
        goodPct: 100, 
        goodTxt: { en: `Properly bandaged and ready to play (-${formatMoney(getLeagueScaledVal(tier, 1000, clubCountry))} Budget)` } 
      },
      opt2: { 
        title: { en: 'Just tape it up' }, 
        goodPct: 30, 
        goodTxt: { en: 'He plays through the pain valiantly (+5 Morale)' },
        badPct: 70,
        badTxt: { en: 'It got infected! He misses the match (-1 OVR)' }
      },
      extraData: {
        opt1Cost: getLeagueScaledVal(tier, 1000, clubCountry),
        opt1Good: {},
        opt2Good: { morale: 5 },
        opt2Bad: { ovr: -1 }
      }
    },
    {
      type: 'handball_7m_lob',
      title: { en: 'FAILED 7-METER LOB' },
      desc: { 
        en: "Your pivot attempted a cheeky lob on a crucial 7-meter penalty, but the goalkeeper easily caught it standing up."
      },
      opt1: { 
        title: { en: 'Fine him for arrogance' }, 
        goodPct: 100, 
        goodTxt: { en: `Discipline enforced (+${formatMoney(getLeagueScaledVal(tier, 500, clubCountry))} Budget, -10 Morale)` } 
      },
      opt2: { 
        title: { en: 'Publicly defend his creativity' }, 
        goodPct: 50, 
        goodTxt: { en: 'His confidence is restored (+10 Morale)' },
        badPct: 50,
        badTxt: { en: 'Fans mock the team\'s arrogance (-500 Fans, -1 Reputation)' }
      },
      extraData: {
        opt1Good: { budget: getLeagueScaledVal(tier, 500, clubCountry), morale: -10 },
        opt2Good: { morale: 10 },
        opt2Bad: { fans: -getLeagueScaledFans(tier, 500, clubCountry, tier), rep: -1 }
      }
    },
    {
      type: 'handball_2min_suspension',
      title: { en: 'SILLY 2-MINUTE SUSPENSION' },
      desc: { 
        en: "Your backcourt player got a 2-minute suspension for aggressively complaining about a blocking foul."
      },
      opt1: { 
        title: { en: 'Yell at the referee' }, 
        goodPct: 20, 
        goodTxt: { en: 'The ref actually apologizes! (No effect)' },
        badPct: 80,
        badTxt: { en: 'You receive a yellow card on the bench! (-5 Morale, -1 Reputation)' }
      },
      opt2: { 
        title: { en: 'Sub in the extra attacker (Empty Net)' }, 
        goodPct: 70, 
        goodTxt: { en: 'The 6-on-6 gamble succeeds! (+1 OVR, +5 Morale)' },
        badPct: 30,
        badTxt: { en: 'Intercepted! Opponent scores from the halfway line (-1 OVR, -10 Morale)' }
      },
      extraData: {
        opt1Good: {},
        opt1Bad: { morale: -5, rep: -1 },
        opt2Good: { ovr: 1, morale: 5 },
        opt2Bad: { ovr: -1, morale: -10 }
      }
    },
    {
      type: 'handball_passive_play',
      title: { en: 'PASSIVE PLAY PANIC' },
      desc: { 
        en: "The referee's arm goes up for passive play. Your team has only 4 passes left to get a shot off!"
      },
      opt1: { 
        title: { en: 'Call a timeout immediately' }, 
        goodPct: 100, 
        goodTxt: { en: 'You draw up a specific play (+1 OVR)' } 
      },
      opt2: { 
        title: { en: 'Scream to force a quick shot' }, 
        goodPct: 40, 
        goodTxt: { en: 'It goes in from 10 meters out! (+10 Morale)' },
        badPct: 60,
        badTxt: { en: 'Easily blocked, fast break conceded (-1 OVR, -5 Morale)' }
      },
      extraData: {
        opt1Good: { ovr: 1 },
        opt2Good: { morale: 10 },
        opt2Bad: { ovr: -1, morale: -5 }
      }
    },
    {
      type: 'handball_keeper_face_shot',
      title: { en: 'KEEPER SHOT IN THE FACE' },
      desc: { 
        en: "An opposing winger throws the ball directly into your goalkeeper's face from close range."
      },
      opt1: { 
        title: { en: 'Storm the court demanding a red card' }, 
        goodPct: 60, 
        goodTxt: { en: 'The opponent is sent off! (+1 OVR)' },
        badPct: 40,
        badTxt: { en: 'Ref warns you for leaving the coaching zone (-1 Reputation)' }
      },
      opt2: { 
        title: { en: 'Sub the keeper to let him recover' }, 
        goodPct: 100, 
        goodTxt: { en: 'The backup keeper makes a huge save! (+5 Morale)' }
      },
      extraData: {
        opt1Good: { ovr: 1 },
        opt1Bad: { rep: -1 },
        opt2Good: { morale: 5 }
      }
    },
    {
      type: 'handball_sticky_ball',
      title: { en: 'TOO MUCH RESIN' },
      desc: { 
        en: "Someone applied way too much resin. The ball literally got stuck to your playmaker's hand during a pass."
      },
      opt1: { 
        title: { en: 'Blame the equipment manager' }, 
        goodPct: 100, 
        goodTxt: { en: 'Avoided media scrutiny, but staff is annoyed (-5 Morale)' } 
      },
      opt2: { 
        title: { en: 'Laugh it off' }, 
        goodPct: 70, 
        goodTxt: { en: 'The team chemistry improves from the joke (+10 Morale)' },
        badPct: 30,
        badTxt: { en: 'Fans think you lack professional focus (-200 Fans)' }
      },
      extraData: {
        opt1Good: { morale: -5 },
        opt2Good: { morale: 10 },
        opt2Bad: { fans: -getLeagueScaledFans(tier, 200, clubCountry, tier) }
      }
    },
    {
      type: 'handball_fast_break_trip',
      title: { en: 'FAST BREAK BLUNDER' },
      desc: { 
        en: "Your winger intercepts the ball for a clear fast break but trips over his own feet approaching the 6-meter line."
      },
      opt1: { 
        title: { en: 'Bench him to teach a lesson' }, 
        goodPct: 100, 
        goodTxt: { en: 'He sulks on the bench (-10 Morale)' } 
      },
      opt2: { 
        title: { en: 'Clap and encourage him' }, 
        goodPct: 50, 
        goodTxt: { en: 'He bounces back and scores 5 straight goals! (+2 OVR)' },
        badPct: 50,
        badTxt: { en: 'His confidence is completely shattered (-1 OVR, -5 Morale)' }
      },
      extraData: {
        opt1Good: { morale: -10 },
        opt2Good: { ovr: 2 },
        opt2Bad: { ovr: -1, morale: -5 }
      }
    },
    {
      type: 'handball_kempa_trick',
      title: { en: 'THE KEMPA TRICK' },
      desc: { 
        en: "Down by one with 30 seconds left. Your players want to try a spectacular Kempa-trick (alley-oop) to tie it."
      },
      opt1: { 
        title: { en: 'Order a safe, structured play' }, 
        goodPct: 100, 
        goodTxt: { en: 'Boring but tactically sound (+1 OVR)' } 
      },
      opt2: { 
        title: { en: 'Greenlight the Kempa' }, 
        goodPct: 30, 
        goodTxt: { en: 'Goal of the season! Crowd goes wild! (+1000 Fans, +15 Morale)' },
        badPct: 70,
        badTxt: { en: 'Dropped the pass in mid-air. Game over. (-1 OVR, -10 Morale)' }
      },
      extraData: {
        opt1Good: { ovr: 1 },
        opt2Good: { fans: getLeagueScaledFans(tier, 1000, clubCountry, tier), morale: 15 },
        opt2Bad: { ovr: -1, morale: -10 }
      }
    },
    {
      type: 'handball_timeout_fail',
      title: { en: 'TIMEOUT DISASTER' },
      desc: { 
        en: "You slammed the green timeout card onto the table right as your player threw a perfect shot. The goal is disallowed."
      },
      opt1: { 
        title: { en: 'Apologize to the team' }, 
        goodPct: 100, 
        goodTxt: { en: 'They forgive your timing error (+5 Morale, -1 Reputation)' } 
      },
      opt2: { 
        title: { en: 'Draw up a genius set piece' }, 
        goodPct: 40, 
        goodTxt: { en: 'They execute it perfectly for a better goal! (+2 OVR)' },
        badPct: 60,
        badTxt: { en: 'Turnover on the set piece, morale plummets (-2 OVR, -15 Morale)' }
      },
      extraData: {
        opt1Good: { morale: 5, rep: -1 },
        opt2Good: { ovr: 2 },
        opt2Bad: { ovr: -2, morale: -15 }
      }
    },
    {
      type: 'handball_sweaty_floor',
      title: { en: 'SWEATY COURT DELAYS' },
      desc: { 
        en: "The match is constantly delayed because the floor wipers can't keep up with the sweat on the court."
      },
      opt1: { 
        title: { en: 'Complain to the delegates' }, 
        goodPct: 100, 
        goodTxt: { en: 'Delays continue, ruining your team\'s rhythm (-5 Morale)' } 
      },
      opt2: { 
        title: { en: 'Grab a mop and help wipe' }, 
        goodPct: 80, 
        goodTxt: { en: 'Fans love your hands-on dedication! (+500 Fans, +1 Reputation)' },
        badPct: 20,
        badTxt: { en: 'You slipped on the sweat in front of everyone (-1 Reputation)' }
      },
      extraData: {
        opt1Good: { morale: -5 },
        opt2Good: { fans: getLeagueScaledFans(tier, 500, clubCountry, tier), rep: 1 },
        opt2Bad: { rep: -1 }
      }
    },
    {
      type: 'handball_straight_red_card',
      title: { en: 'HARD FOUL RED CARD' },
      desc: { 
        en: "Your best defender gets a straight red card for hitting an attacking player in the neck during a jump shot."
      },
      opt1: { 
        title: { en: 'Shift to an aggressive 5-1 defense' }, 
        goodPct: 50, 
        goodTxt: { en: 'The aggressive high-line forces turnovers! (+1 OVR)' },
        badPct: 50,
        badTxt: { en: 'The defense gets completely shredded by the pivot (-2 OVR)' }
      },
      opt2: { 
        title: { en: 'Play a safe, flat 6-0 defense' }, 
        goodPct: 100, 
        goodTxt: { en: 'Damage is limited, but attacking is harder (-1 OVR)' } 
      },
      extraData: {
        opt1Good: { ovr: 1 },
        opt1Bad: { ovr: -2 },
        opt2Good: { ovr: -1 }
      }
    },
    {
      type: 'handball_empty_net_gamble',
      title: { en: '7-ON-6 GAMBLE' },
      desc: { 
        en: "You pulled the goalie for an extra attacker, but your playmaker fumbled the ball. The opponent is aiming for the empty net!"
      },
      opt1: { 
        title: { en: 'Hope they miss from 30 meters' }, 
        goodPct: 20, 
        goodTxt: { en: 'They hit the post! Incredibly lucky! (+5 Morale)' },
        badPct: 80,
        badTxt: { en: 'Easy empty-net goal for them (-1 OVR, -10 Morale)' }
      },
      opt2: { 
        title: { en: 'Have a field player jump in the crease' }, 
        goodPct: 100, 
        goodTxt: { en: 'Penalty shot given, but you saved a guaranteed goal (-1 Reputation)' } 
      },
      extraData: {
        opt1Good: { morale: 5 },
        opt1Bad: { ovr: -1, morale: -10 },
        opt2Good: { rep: -1 }
      }
    },
    {
      type: 'handball_ripped_shoe',
      title: { en: 'SHOE BLOWOUT' },
      desc: { 
        en: "Your winger plants his foot hard for a jump shot and his shoe completely explodes."
      },
      opt1: { 
        title: { en: 'Tape it heavily together' }, 
        goodPct: 30, 
        goodTxt: { en: 'He scores the game winner in taped shoes! (+10 Morale)' },
        badPct: 70,
        badTxt: { en: 'He slips due to lack of grip and turns it over (-1 OVR)' }
      },
      opt2: { 
        title: { en: 'Sub him out immediately' }, 
        goodPct: 100, 
        goodTxt: { en: 'Safe tactical choice, but he is frustrated (-5 Morale)' } 
      },
      extraData: {
        opt1Good: { morale: 10 },
        opt1Bad: { ovr: -1 },
        opt2Good: { morale: -5 }
      }
    },
    {
      type: 'handball_torn_jersey',
      title: { en: 'TORN JERSEY' },
      desc: { 
        en: "A defender grabs your pivot so hard on the 6-meter line that his jersey rips completely in half."
      },
      opt1: { 
        title: { en: 'Demand a 2-minute penalty' }, 
        goodPct: 70, 
        goodTxt: { en: 'Referee agrees, man advantage! (+1 OVR)' },
        badPct: 30,
        badTxt: { en: 'Referee ignores it, play continues (-5 Morale)' }
      },
      opt2: { 
        title: { en: 'Get a spare jersey' }, 
        goodPct: 100, 
        goodTxt: { en: `He plays in a blank, unnumbered shirt (-${formatMoney(getLeagueScaledVal(tier, 200, clubCountry))} Budget)` } 
      },
      extraData: {
        opt1Good: { ovr: 1 },
        opt1Bad: { morale: -5 },
        opt2Cost: getLeagueScaledVal(tier, 200, clubCountry),
        opt2Good: {}
      }
    },
    {
      type: 'handball_faulty_substitution',
      title: { en: 'FAULTY SUBSTITUTION' },
      desc: { 
        en: "A miscommunication during a fast break leads to 8 players on the court. The delegate table buzzes for a 2-minute penalty."
      },
      opt1: { 
        title: { en: 'Blame the assistant coach' }, 
        goodPct: 100, 
        goodTxt: { en: 'Staff morale takes a major hit (-10 Morale)' } 
      },
      opt2: { 
        title: { en: 'Take full responsibility' }, 
        goodPct: 100, 
        goodTxt: { en: 'Players respect your honesty (+5 Morale, -1 Reputation)' } 
      },
      extraData: {
        opt1Good: { morale: -10 },
        opt2Good: { morale: 5, rep: -1 }
      }
    },
    {
      type: 'handball_final_9m_throw',
      title: { en: 'LAST SECOND FREE-THROW' },
      desc: { 
        en: "Time is up! You have a final 9-meter free throw over a massive 6-man defensive wall."
      },
      opt1: { 
        title: { en: 'Have your tallest player shoot over the wall' }, 
        goodPct: 20, 
        goodTxt: { en: 'Top corner! Unbelievable winner! (+2 OVR, +20 Morale, +500 Fans)' },
        badPct: 80,
        badTxt: { en: 'Blocked by the giant defenders (No effect)' }
      },
      opt2: { 
        title: { en: 'Try a sneaky trick pass' }, 
        goodPct: 40, 
        goodTxt: { en: 'Caught the wall off guard! Goal! (+1 OVR, +10 Morale)' },
        badPct: 60,
        badTxt: { en: 'Illegal block by a teammate, goal disallowed (-5 Morale)' }
      },
      extraData: {
        opt1Good: { ovr: 2, morale: 20, fans: getLeagueScaledFans(tier, 500, clubCountry, tier) },
        opt1Bad: {},
        opt2Good: { ovr: 1, morale: 10 },
        opt2Bad: { morale: -5 }
      }
    },
    {
      type: 'handball_goalie_goal',
      title: { en: 'GOALKEEPER SCORES' },
      desc: { 
        en: "Your goalkeeper catches a shot and launches it full court into the opponent's empty net!"
      },
      opt1: { 
        title: { en: 'Celebrate wildly' }, 
        goodPct: 50, 
        goodTxt: { en: 'The arena goes crazy! (+10 Morale, +200 Fans)' },
        badPct: 50,
        badTxt: { en: 'Goalkeeper injures his throwing shoulder celebrating (-1 OVR, -10 Morale)' }
      },
      opt2: { 
        title: { en: 'Act like it was a planned tactical move' }, 
        goodPct: 100, 
        goodTxt: { en: 'The press calls you a tactical genius (+1 Reputation)' } 
      },
      extraData: {
        opt1Good: { morale: 10, fans: getLeagueScaledFans(tier, 200, clubCountry, tier) },
        opt1Bad: { ovr: -1, morale: -10 },
        opt2Good: { rep: 1 }
      }
    },
    {
      type: 'handball_resin_in_eye',
      title: { en: 'RESIN IN EYE' },
      desc: { 
        en: "Your playmaker wiped sweat from his face with his resin-covered hands and glued his eyelid shut."
      },
      opt1: { 
        title: { en: 'Use baby oil to remove it on the bench' }, 
        goodPct: 100, 
        goodTxt: { en: 'He misses 10 minutes of play but recovers (-1 OVR)' } 
      },
      opt2: { 
        title: { en: 'Tell him to play with one eye open' }, 
        goodPct: 20, 
        goodTxt: { en: 'He throws no-look passes perfectly! (+2 OVR)' },
        badPct: 80,
        badTxt: { en: 'He passes the ball directly into the stands (-1 OVR, -10 Morale)' }
      },
      extraData: {
        opt1Good: { ovr: -1 },
        opt2Good: { ovr: 2 },
        opt2Bad: { ovr: -1, morale: -10 }
      }
    },
    {
      type: 'handball_broken_net',
      title: { en: 'BROKEN GOAL NET' },
      desc: { 
        en: "During warmup, your pivot throws so hard that the goal net snaps off the post."
      },
      opt1: { 
        title: { en: 'Pay arena staff to fix it immediately' }, 
        goodPct: 100, 
        goodTxt: { en: `Fixed before tip-off (-${formatMoney(getLeagueScaledVal(tier, 300, clubCountry))} Budget)` } 
      },
      opt2: { 
        title: { en: 'Tape it and delay the match' }, 
        goodPct: 100, 
        goodTxt: { en: 'The delay frustrates the crowd and players (-5 Morale, -1 Reputation)' } 
      },
      extraData: {
        opt1Cost: getLeagueScaledVal(tier, 300, clubCountry),
        opt1Good: {},
        opt2Good: { morale: -5, rep: -1 }
      }
    },
    {
      type: 'handball_pivot_battered',
      title: { en: 'BATTERED PIVOT' },
      desc: { 
        en: "Your pivot is getting absolutely mauled by two massive central defenders on the 6-meter line."
      },
      opt1: { 
        title: { en: 'Tell him to keep fighting' }, 
        goodPct: 40, 
        goodTxt: { en: 'He draws two 7-meter penalties! (+1 OVR, +10 Morale)' },
        badPct: 60,
        badTxt: { en: 'He suffers a bruised rib and has to be subbed (-2 OVR)' }
      },
      opt2: { 
        title: { en: 'Sub him out for a lighter, faster player' }, 
        goodPct: 100, 
        goodTxt: { en: 'You lose physical presence but maintain health (-1 OVR)' } 
      },
      extraData: {
        opt1Good: { ovr: 1, morale: 10 },
        opt1Bad: { ovr: -2 },
        opt2Good: { ovr: -1 }
      }
    },
    {
      type: 'handball_wing_angle',
      title: { en: 'TIGHT WING ANGLES' },
      desc: { 
        en: "Your wingers are struggling to score from tight angles. They need extra court time to practice."
      },
      opt1: { 
        title: { en: 'Rent extra arena time' }, 
        goodPct: 100, 
        goodTxt: { en: `Shooting accuracy improves! (-${formatMoney(getLeagueScaledVal(tier, 800, clubCountry))} Budget, +1 OVR)` } 
      },
      opt2: { 
        title: { en: 'Skip the extra practice' }, 
        goodPct: 100, 
        goodTxt: { en: 'They continue to struggle in matches (No effect)' } 
      },
      extraData: {
        opt1Cost: getLeagueScaledVal(tier, 800, clubCountry),
        opt1Good: { ovr: 1 },
        opt2Good: {}
      }
    },
    {
      type: 'handball_penalty_yips',
      title: { en: 'THE 7-METER YIPS' },
      desc: { 
        en: "Your star penalty taker has missed three 7-meter throws in a row and looks visibly shaken."
      },
      opt1: { 
        title: { en: 'Change the penalty taker' }, 
        goodPct: 100, 
        goodTxt: { en: 'The new taker scores, but the star is upset (+1 OVR, -5 Morale)' } 
      },
      opt2: { 
        title: { en: 'Trust him with the next one' }, 
        goodPct: 50, 
        goodTxt: { en: 'He scores! The curse is broken (+10 Morale)' },
        badPct: 50,
        badTxt: { en: 'He misses again. The crowd groans (-200 Fans, -10 Morale)' }
      },
      extraData: {
        opt1Good: { ovr: 1, morale: -5 },
        opt2Good: { morale: 10 },
        opt2Bad: { fans: -getLeagueScaledFans(tier, 200, clubCountry, tier), morale: -10 }
      }
    },
    {
      type: 'handball_sweeper_keeper',
      title: { en: 'SWEEPER KEEPER' },
      desc: { 
        en: "Your goalkeeper wants permission to play aggressively outside the 9-meter line to intercept fast breaks."
      },
      opt1: { 
        title: { en: 'Allow the aggressive style' }, 
        goodPct: 40, 
        goodTxt: { en: 'He intercepts three fast breaks! (+2 OVR, +300 Fans)' },
        badPct: 60,
        badTxt: { en: 'He gets chipped from midfield (-1 OVR, -2 Reputation)' }
      },
      opt2: { 
        title: { en: 'Order him to stay in the crease' }, 
        goodPct: 100, 
        goodTxt: { en: 'A safe, conservative approach (+1 Reputation, -5 Morale)' } 
      },
      extraData: {
        opt1Good: { ovr: 2, fans: getLeagueScaledFans(tier, 300, clubCountry, tier) },
        opt1Bad: { ovr: -1, rep: -2 },
        opt2Good: { rep: 1, morale: -5 }
      }
    },
    {
      type: 'handball_resin_allergy',
      title: { en: 'RESIN ALLERGY' },
      desc: { 
        en: "Your new backcourt signing developed an allergic rash to the standard resin used by the team."
      },
      opt1: { 
        title: { en: 'Buy specialized hypoallergenic resin' }, 
        goodPct: 100, 
        goodTxt: { en: `He can play comfortably (-${formatMoney(getLeagueScaledVal(tier, 600, clubCountry))} Budget, +5 Morale)` } 
      },
      opt2: { 
        title: { en: 'Tell him to wear gloves or adapt' }, 
        goodPct: 100, 
        goodTxt: { en: 'He loses grip and turns the ball over (-1 OVR, -10 Morale)' } 
      },
      extraData: {
        opt1Cost: getLeagueScaledVal(tier, 600, clubCountry),
        opt1Good: { morale: 5 },
        opt2Good: { ovr: -1, morale: -10 }
      }
    },
    {
      type: 'handball_buzzer_beater',
      title: { en: 'BUZZER BEATER CONTROVERSY' },
      desc: { 
        en: "Your team scored a fast-break goal exactly at 60:00. The delegate table says it was a fraction of a second late."
      },
      opt1: { 
        title: { en: 'File an official protest' }, 
        goodPct: 30, 
        goodTxt: { en: `The goal is awarded upon review! (+1 OVR, +2 Reputation)` },
        badPct: 70,
        badTxt: { en: `Protest denied, fine issued (-${formatMoney(getLeagueScaledVal(tier, 1000, clubCountry))} Budget, -5 Morale)` }
      },
      opt2: { 
        title: { en: 'Accept the decision' }, 
        goodPct: 100, 
        goodTxt: { en: 'The team feels cheated (-10 Morale)' } 
      },
      extraData: {
        opt1Good: { ovr: 1, rep: 2 },
        opt1Bad: { budget: -getLeagueScaledVal(tier, 1000, clubCountry), morale: -5 },
        opt2Good: { morale: -10 }
      }
    },
    {
      type: 'handball_defensive_specialist',
      title: { en: 'DEFENSIVE SPECIALIST' },
      desc: { 
        en: "The board wants to sign a massive defensive specialist who only plays in the central block and never attacks."
      },
      opt1: { 
        title: { en: 'Sign him for defensive stability' }, 
        goodPct: 100, 
        goodTxt: { en: `Defense improves, but substitution rhythm is tricky (-${formatMoney(getLeagueScaledVal(tier, 5000, clubCountry))} Budget, +1 OVR)` } 
      },
      opt2: { 
        title: { en: 'Rely on two-way players' }, 
        goodPct: 100, 
        goodTxt: { en: 'The squad appreciates your trust in their stamina (+10 Morale)' } 
      },
      extraData: {
        opt1Cost: getLeagueScaledVal(tier, 5000, clubCountry),
        opt1Good: { ovr: 1 },
        opt2Good: { morale: 10 }
      }
    },
    {
      type: 'handball_shoe_deal',
      title: { en: 'DUBIOUS SHOE DEAL' },
      desc: { 
        en: "A sponsor offers a lucrative deal if the team wears their shoes, but the shoes have terrible ankle support for jumping."
      },
      opt1: { 
        title: { en: 'Accept the money' }, 
        goodPct: 20, 
        goodTxt: { en: `No injuries! Huge payout! (+${formatMoney(getLeagueScaledVal(tier, 8000, clubCountry))} Budget)` },
        badPct: 80,
        badTxt: { en: `Two players sprain their ankles (+${formatMoney(getLeagueScaledVal(tier, 8000, clubCountry))} Budget, -2 OVR)` }
      },
      opt2: { 
        title: { en: 'Reject the sponsor' }, 
        goodPct: 100, 
        goodTxt: { en: 'Players are grateful for keeping them safe (+15 Morale)' } 
      },
      extraData: {
        opt1Good: { budget: getLeagueScaledVal(tier, 8000, clubCountry) },
        opt1Bad: { budget: getLeagueScaledVal(tier, 8000, clubCountry), ovr: -2 },
        opt2Good: { morale: 15 }
      }
    },
    {
      type: 'handball_blue_card_appeal',
      title: { en: 'BLUE CARD APPEAL' },
      desc: { 
        en: "A key player received a blue card (written report) for an allegedly dangerous foul. He faces a long suspension."
      },
      opt1: { 
        title: { en: 'Hire a sports lawyer to appeal' }, 
        goodPct: 50, 
        goodTxt: { en: `Suspension overturned! (-${formatMoney(getLeagueScaledVal(tier, 3000, clubCountry))} Budget, +1 OVR)` },
        badPct: 50,
        badTxt: { en: `Appeal fails, money wasted (-${formatMoney(getLeagueScaledVal(tier, 3000, clubCountry))} Budget, -1 OVR)` }
      },
      opt2: { 
        title: { en: 'Accept the suspension' }, 
        goodPct: 100, 
        goodTxt: { en: 'You lose the player for three matches (-2 OVR)' } 
      },
      extraData: {
        opt1Cost: getLeagueScaledVal(tier, 3000, clubCountry),
        opt1Good: { ovr: 1 },
        opt1Bad: { ovr: -1 },
        opt2Good: { ovr: -2 }
      }
    },
    {
      type: 'handball_court_condensation',
      title: { en: 'DANGEROUS CONDENSATION' },
      desc: { 
        en: "A humid arena has caused condensation on the court, making the 6-meter line incredibly slippery."
      },
      opt1: { 
        title: { en: 'Play a slower, safe passing game' }, 
        goodPct: 100, 
        goodTxt: { en: 'No injuries, but the attack is sluggish (-1 OVR, +1 Reputation)' } 
      },
      opt2: { 
        title: { en: 'Attack at full speed' }, 
        goodPct: 30, 
        goodTxt: { en: 'Exciting fast breaks! (+300 Fans, +1 OVR)' },
        badPct: 70,
        badTxt: { en: 'A winger slips and pulls a hamstring (-2 OVR)' }
      },
      extraData: {
        opt1Good: { ovr: -1, rep: 1 },
        opt2Good: { fans: getLeagueScaledFans(tier, 300, clubCountry, tier), ovr: 1 },
        opt2Bad: { ovr: -2 }
      }
    },
    {
      type: 'handball_halftime_speech',
      title: { en: 'HALFTIME DEFICIT' },
      desc: { 
        en: "You are down by 5 goals at halftime. The players look exhausted and defeated."
      },
      opt1: { 
        title: { en: 'Draw up a complex new tactical system' }, 
        goodPct: 40, 
        goodTxt: { en: 'The tactical shift confuses the opponent! (+2 OVR)' },
        badPct: 60,
        badTxt: { en: 'Players are too tired to execute it (-1 OVR, -10 Morale)' }
      },
      opt2: { 
        title: { en: 'Give an emotional motivational speech' }, 
        goodPct: 100, 
        goodTxt: { en: 'The team fights back with passion! (+15 Morale, +200 Fans)' } 
      },
      extraData: {
        opt1Good: { ovr: 2 },
        opt1Bad: { ovr: -1, morale: -10 },
        opt2Good: { morale: 15, fans: getLeagueScaledFans(tier, 200, clubCountry, tier) }
      }
    },
    {
      type: 'handball_aggressive_pivot',
      title: { en: 'OVER-AGGRESSIVE PIVOT' },
      desc: { 
        en: "Your pivot is getting suspended almost every game for grabbing jerseys and neck-high tackles."
      },
      opt1: { 
        title: { en: 'Fine him internally' }, 
        goodPct: 100, 
        goodTxt: { en: `He cleans up his act but loses his edge (+${formatMoney(getLeagueScaledVal(tier, 500, clubCountry))} Budget, -1 OVR)` } 
      },
      opt2: { 
        title: { en: 'Defend his physical style to the press' }, 
        goodPct: 100, 
        goodTxt: { en: 'He loves your support, but referees hate you (+10 Morale, -2 Reputation)' } 
      },
      extraData: {
        opt1Good: { budget: getLeagueScaledVal(tier, 500, clubCountry), ovr: -1 },
        opt2Good: { morale: 10, rep: -2 }
      }
    },
    {
      type: 'handball_wax_spill',
      title: { en: 'WAX SPILL DISASTER' },
      desc: { 
        en: "A massive bucket of liquid handball wax spilled in the locker room, ruining several pairs of shoes."
      },
      opt1: { 
        title: { en: 'Buy replacement gear immediately' }, 
        goodPct: 100, 
        goodTxt: { en: `Everyone is ready for the match (-${formatMoney(getLeagueScaledVal(tier, 2000, clubCountry))} Budget)` } 
      },
      opt2: { 
        title: { en: 'Make them clean it and play in sticky shoes' }, 
        goodPct: 100, 
        goodTxt: { en: 'Players are miserable and slipping on the court (-1 OVR, -15 Morale)' } 
      },
      extraData: {
        opt1Cost: getLeagueScaledVal(tier, 2000, clubCountry),
        opt1Good: {},
        opt2Good: { ovr: -1, morale: -15 }
      }
    },
    {
      type: 'handball_fast_break_tactics',
      title: { en: 'FAST BREAK STRATEGY' },
      desc: { 
        en: "The coaching staff suggests running high-risk, high-reward fast breaks on every single possession."
      },
      opt1: { 
        title: { en: 'Implement the fast break blitz' }, 
        goodPct: 50, 
        goodTxt: { en: 'You overwhelm the opponent with speed! (+2 OVR, +400 Fans)' },
        badPct: 50,
        badTxt: { en: 'The team is exhausted by the 45th minute (-2 OVR, -10 Morale)' }
      },
      opt2: { 
        title: { en: 'Stick to slow, structured build-up' }, 
        goodPct: 100, 
        goodTxt: { en: 'Controlled possession keeps the team fresh (+1 OVR)' } 
      },
      extraData: {
        opt1Good: { ovr: 2, fans: getLeagueScaledFans(tier, 400, clubCountry, tier) },
        opt1Bad: { ovr: -2, morale: -10 },
        opt2Good: { ovr: 1 }
      }
    }
    ];

    const extraEvents: GameEvent[] = [];
    const unprotectedYouth = currentState.youthPipeline?.find(y => !y.isProtected && y.boost >= 3);
    const poachingCost = getLeagueScaledVal(tier, 25000, clubCountry);

    if (unprotectedYouth) {
      extraEvents.push({
        type: 'youth_poaching_attempt',
        title: { en: 'YOUTH ACADEMY POACHING!' },
        desc: {
          en: `A massive rival club has illegally approached your unprotected top handball prospect, ${unprotectedYouth.name}.`
        },
        opt1: {
          title: { en: `Pay Bonus (-${formatMoney(poachingCost)})` },
          goodPct: 100,
          goodTxt: { en: `Keep ${unprotectedYouth.name} & secure contract` }
        },
        opt2: {
          title: { en: 'Let Him Walk' },
          goodPct: 100,
          goodTxt: { en: `${unprotectedYouth.name} departed to rival academy` }
        },
        extraData: {
            opt1Cost: poachingCost,
            opt1Good: {},
            opt2Good: {},
            prospectId: unprotectedYouth.id,
            prospectName: unprotectedYouth.name
        }
      });
    }

    if ((currentState.club.morale ?? 100) < 50) {
      extraEvents.push({
        type: 'toxic_dressing_room',
        title: { en: 'TOXIC DRESSING ROOM' },
        desc: {
          en: `Squad morale is collapsing. The backcourt and wingers are blaming each other for bad passes.`
        },
        opt1: {
          title: { en: `Host Peace Talks (-${formatMoney(getLeagueScaledVal(tier, 5000, clubCountry))})` },
          goodPct: 100,
          goodTxt: { en: 'Restore Morale (+15 Morale)' }
        },
        opt2: {
          title: { en: 'Fine the Instigators' },
          goodPct: 100,
          goodTxt: { en: `Gain Cash, Squad Resents You (+${formatMoney(getLeagueScaledVal(tier, 2000, clubCountry))} Budget, -1 OVR)` }
        },
        extraData: {
            opt1Cost: getLeagueScaledVal(tier, 5000, clubCountry),
            opt1Good: { morale: 15 },
            opt2Good: { budget: getLeagueScaledVal(tier, 2000, clubCountry), ovr: -1 }
        }
      });
    }

    const isReserve = isReserveClub(currentState.club.name);
    const allEvents = [...events, ...extraEvents].filter(ev => !(isReserve && ev.type === 'cup_fever'));
    
    let chosen: GameEvent | null = allEvents[Math.floor(Math.random() * allEvents.length)] || allEvents[0] || null;
    return chosen;
};

export const generateMidSeasonCrisis = (currentState: GameState): GameEvent | null => {
    const tier = currentState.club.tier;
    const clubCountry = currentState.club.country || 'GER';
    const medLevel = currentState.club.medicalLevel || 1;
    const baseRehabCost = getLeagueScaledVal(tier, 150000, clubCountry);
    const rehabCost = medLevel >= 3 ? Math.round(baseRehabCost * 0.25) : medLevel >= 2 ? Math.round(baseRehabCost * 0.5) : baseRehabCost;
    const rehabGoodPct = medLevel >= 3 ? 100 : medLevel >= 2 ? 95 : 80;
    const rehabBadPct = 100 - rehabGoodPct;
    
    // Some random crises
    const crises: GameEvent[] = [
        {
            type: 'injury_crisis',
            title: { en: 'STAR PLAYER INJURY', de: 'VERLETZUNG DES STARS' },
            desc: { 
                en: medLevel >= 3
                    ? `Your best player suffered a knock before the second half, but your Level ${medLevel} Sports Science Lab enables rapid low-cost recovery.`
                    : `Your best player has suffered a severe injury right before the critical second half of the season.`,
                de: medLevel >= 3
                    ? `Dein bester Spieler hat sich vor der Rückrunde verletzt – dein Sportwissenschaftliches Labor (Stufe ${medLevel}) sichert eine schnelle Genesung.`
                    : `Dein bester Spieler hat sich kurz vor der kritischen Rückrunde schwer verletzt.`
            },
            opt1: {
                title: { en: `Pay for elite rehab (${formatMoney(rehabCost)})`, de: `Elite-Reha bezahlen (${formatMoney(rehabCost)})` },
                goodPct: rehabGoodPct,
                goodTxt: { en: 'He recovered quickly! No OVR drop.', de: 'Er erholte sich schnell! Kein OVR-Verlust.' },
                badPct: rehabBadPct,
                badTxt: { en: 'Rehab failed, season over (-1 OVR).', de: 'Reha gescheitert, Saison beendet (-1 OVR).' }
            },
            opt2: {
                title: { en: 'Rely on the squad (Free)', de: 'Auf den Kader vertrauen (Kostenlos)' },
                goodPct: medLevel >= 3 ? 40 : 10,
                goodTxt: { en: 'The team stepped up! (+5 Morale)', de: 'Das Team sprang in die Bresche! (+5 Moral)' },
                badPct: medLevel >= 3 ? 60 : 90,
                badTxt: { en: 'The gap was too big to fill (-1 OVR).', de: 'Die Lücke war zu groß (-1 OVR).' }
            },
            extraData: {
                opt1Cost: rehabCost,
                opt1Good: medLevel >= 3 ? { morale: 3 } : {},
                opt1Bad: { ovr: -1 },
                opt2Good: { morale: 5 },
                opt2Bad: { ovr: -1 }
            }
        },
        {
            type: 'sponsor_pullout',
            title: { en: 'SPONSOR PULLOUT', de: 'SPONSOR-RÜCKZUG' },
            desc: {
                en: `A major sponsor is threatening to pull out due to a PR scandal involving one of your players.`,
                de: `Ein Hauptsponsor droht wegen eines PR-Skandals um einen deiner Spieler abzuspringen.`
            },
            opt1: {
                title: { en: 'Suspend the player (-1 OVR)', de: 'Spieler suspendieren (-1 OVR)' },
                goodPct: 100,
                goodTxt: { en: 'Sponsor retained, but squad weakened.', de: 'Sponsor gehalten, aber Kader geschwächt.' },
                badPct: 0,
                badTxt: { en: '', de: '' }
            },
            opt2: {
                title: { en: 'Defend the player (Risk Sponsor)', de: 'Spieler verteidigen (Sponsor riskieren)' },
                goodPct: 30,
                goodTxt: { en: 'Sponsor backed down! (+10 Morale)', de: 'Sponsor lenkte ein! (+10 Moral)' },
                badPct: 70,
                badTxt: { en: `Sponsor left! (-${formatMoney(getLeagueScaledVal(tier, 250000, clubCountry))})`, de: `Sponsor weg! (-${formatMoney(getLeagueScaledVal(tier, 250000, clubCountry))})` }
            },
            extraData: {
                opt1Cost: 0,
                opt1Good: { ovr: -1 },
                opt2Good: { morale: 10 },
                opt2Bad: { budget: -getLeagueScaledVal(tier, 250000, clubCountry) }
            }
        },
        {
            type: 'fan_protest',
            title: { en: 'FAN PROTESTS', de: 'FAN-PROTESTE' },
            desc: {
                en: `The fan clubs are protesting the ticket prices and boycotting the upcoming matches.`,
                de: `Die Fanclubs protestieren gegen die Ticketpreise und boykottieren die nächsten Spiele.`
            },
            opt1: {
                title: { en: 'Lower ticket prices', de: 'Ticketpreise senken' },
                goodPct: 100,
                goodTxt: { en: `Fans are back! (-${formatMoney(getLeagueScaledVal(tier, 100000, clubCountry))})`, de: `Fans sind zurück! (-${formatMoney(getLeagueScaledVal(tier, 100000, clubCountry))})` },
                badPct: 0,
                badTxt: { en: '', de: '' }
            },
            opt2: {
                title: { en: 'Ignore the protests', de: 'Proteste ignorieren' },
                goodPct: 20,
                goodTxt: { en: 'Protests fizzled out.', de: 'Proteste verliefen im Sande.' },
                badPct: 80,
                badTxt: { en: 'Empty arena hurts morale (-15 Morale).', de: 'Leere Halle schadet der Moral (-15 Moral).' }
            },
            extraData: {
                opt1Cost: getLeagueScaledVal(tier, 100000, clubCountry),
                opt1Good: {},
                opt2Good: {},
                opt2Bad: { morale: -15 }
            }
        }
    ];

    return crises[Math.floor(Math.random() * crises.length)];
};

export const resolveDynamicEvent = (
  state: GameState,
  event: GameEvent,
  choiceIndex: number,
  tier: number
): { updated: GameState; toastMsg: string; toastType: 'success' | 'error' | 'warning' | 'info'; costAttempt: number; acceptJobClub?: Club } | null => {
  const updated = { ...state, club: { ...state.club } };
  
  const opt = choiceIndex === 0 ? event.opt1 : event.opt2;
  if (!opt) return null;
  
  if (event.type === 'random_job_offer') {
      if (choiceIndex === 0 && event.extraData?.randomClubId) {
          const clubId = event.extraData.randomClubId;
          const baseRandomClub = ALL_CLUBS.find(c => String(c.id) === String(clubId));
          const worldRandomEntry = state.worldClubs?.[String(clubId)] || state.worldClubs?.[Number(clubId)];
          const randomClub = baseRandomClub ? { ...baseRandomClub, ...(worldRandomEntry || {}) } : worldRandomEntry;
          if (randomClub) {
              return {
                  updated,
                  acceptJobClub: randomClub,
                  toastMsg: `Accepted offer from ${randomClub.name}!`,
                  toastType: 'success',
                  costAttempt: 0
              };
          }
      } else {
          updated.club.morale = Math.min(100, (updated.club.morale || 50) + 5);
          return {
              updated,
              toastMsg: 'Loyalty appreciated (+5 Morale)',
              toastType: 'success',
              costAttempt: 0
          };
      }
  }

  if (event.type === 'first_team_offer') {
      if (choiceIndex === 0) {
          const firstTeamName = state.club.name.replace(' Youngsters', '').replace(' II', '');
          const baseFirstTeamClub = ALL_CLUBS.find(c => c.name === firstTeamName && c.country === state.club.country);
          const worldFirstTeamEntry = baseFirstTeamClub
              ? (state.worldClubs?.[String(baseFirstTeamClub.id)] || state.worldClubs?.[Number(baseFirstTeamClub.id)])
              : undefined;
          const firstTeamClub = baseFirstTeamClub ? { ...baseFirstTeamClub, ...(worldFirstTeamEntry || {}) } : undefined;
          if (firstTeamClub) {
              return {
                  updated,
                  acceptJobClub: firstTeamClub,
                  toastMsg: `Accepted offer from ${firstTeamName}!`,
                  toastType: 'success',
                  costAttempt: 0
              };
          }
      } else {
          updated.club.morale = Math.min(100, (updated.club.morale || 50) + 10);
          return {
              updated,
              toastMsg: 'Loyalty appreciated (+10 Morale)',
              toastType: 'success',
              costAttempt: 0
          };
      }
  }

  if (event.type === 'youth_poaching_attempt') {
      const prospectId = event.extraData?.prospectId;
      const prospectName = event.extraData?.prospectName || 'Prospect';
      if (choiceIndex === 0) {
          const cost = event.extraData?.opt1Cost || 0;
          updated.budget -= cost;
          if (updated.youthPipeline) {
              updated.youthPipeline = updated.youthPipeline.map(p =>
                  p.id === prospectId ? { ...p, isProtected: true } : p
              );
          }
          return {
              updated,
              toastMsg: `Paid retention bonus! ${prospectName} protected in youth academy.`,
              toastType: 'success',
              costAttempt: cost
          };
      } else {
          if (updated.youthPipeline) {
              updated.youthPipeline = updated.youthPipeline.filter(p => p.id !== prospectId);
          }
          return {
              updated,
              toastMsg: `${prospectName} departed academy for rival club.`,
              toastType: 'warning',
              costAttempt: 0
          };
      }
  }

  const extraData = (event as any).extraData || {};
  const costAttempt = choiceIndex === 0 ? (extraData.opt1Cost || 0) : (extraData.opt2Cost || 0);

  if (costAttempt > 0) {
    updated.budget -= costAttempt;
  }

  const isSuccess = !opt.badPct || (Math.random() * 100 > opt.badPct);
  
  const effects = choiceIndex === 0
    ? (isSuccess ? extraData.opt1Good : extraData.opt1Bad)
    : (isSuccess ? extraData.opt2Good : extraData.opt2Bad);

  const getLocalizedText = (txt: any) => {
    if (!txt) return '';
    if (typeof txt === 'string') return txt;
    return txt.en || '';
  };

  if (effects) {
    if (effects.ovr) {
      const oldOvr = updated.club.baseOvr;
      const newOvr = Math.max(30, Math.min(100, updated.club.baseOvr + effects.ovr));
      const actualDelta = newOvr - oldOvr;
      if (actualDelta !== 0) {
        if (typeof (updated as any).startOfSeasonOvr !== 'number') {
          (updated as any).startOfSeasonOvr = oldOvr;
        }
        if (typeof (updated as any).lastOvr !== 'number') {
          (updated as any).lastOvr = oldOvr;
        }
        if (actualDelta > 0) {
          (updated as any).eventOvrGainThisSeason = ((updated as any).eventOvrGainThisSeason || 0) + actualDelta;
        } else {
          (updated as any).signingFlopLossThisSeason = ((updated as any).signingFlopLossThisSeason || 0) + Math.abs(actualDelta);
        }
      }
      updated.club.baseOvr = newOvr;
      if (updated.worldClubs && updated.worldClubs[updated.club.id]) {
        updated.worldClubs = {
          ...updated.worldClubs,
          [updated.club.id]: {
            ...updated.worldClubs[updated.club.id],
            baseOvr: newOvr
          }
        };
      }
      updated.ovrHistory = [
        {
          id: Math.random().toString(36).substring(7),
          season: updated.year,
          change: newOvr - oldOvr,
          reason: `Event: ${getLocalizedText(event.title)}`,
          reasonDe: `Ereignis: ${getLocalizedText(event.title)}`
        },
        ...(updated.ovrHistory || [])
      ].slice(0, 30);
    }
    if (effects.rep) updated.reputation = Math.max(1, Math.min(100, updated.reputation + effects.rep));
    if (effects.fans) {
      const currentFans = updated.club.fanBase || 1000;
      const ceiling = getClubCatchmentCeiling(updated.club, updated).maxCeiling;
      const effectiveCeiling = effects.fans > 0 ? Math.max(ceiling, currentFans) : ceiling;
      updated.club.fanBase = Math.min(effectiveCeiling, Math.max(100, currentFans + effects.fans));
      if (updated.worldClubs && updated.worldClubs[updated.club.id]) {
        updated.worldClubs = {
          ...updated.worldClubs,
          [updated.club.id]: {
            ...updated.worldClubs[updated.club.id],
            fanBase: updated.club.fanBase
          }
        };
      }
    }
    if (effects.morale) updated.club.morale = Math.max(0, Math.min(100, (updated.club.morale || 100) + effects.morale));
    if (effects.budget || effects.money) {
      updated.budget += (effects.budget || effects.money || 0);
    }
  }

  const toastMsg = isSuccess ? getLocalizedText(opt.goodTxt) : getLocalizedText(opt.badTxt);
  const toastType = isSuccess ? 'success' : 'error';

  return { updated, toastMsg: toastMsg || 'Event resolved', toastType, costAttempt };
};
