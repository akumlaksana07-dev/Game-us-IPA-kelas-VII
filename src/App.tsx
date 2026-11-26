import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { cozySynth } from './audio/cozySynth';
import { CompanionModal } from './components/CompanionModal';
import { DeveloperProfileModal } from './components/DeveloperProfileModal';
import { HudOverlay } from './components/HudOverlay';
import { IsometricWorldCanvas } from './components/IsometricWorldCanvas';
import { PauseModal } from './components/PauseModal';
import { QuizModal } from './components/QuizModal';
import { TitleScreen } from './components/TitleScreen';
import { UpgradesModal } from './components/UpgradesModal';
import {
  COMPANIONS,
  EVOLUTION_THRESHOLDS,
  STAGE_LABELS,
} from './data/companions';
import { QUIZ_QUESTIONS, shuffleQuestions } from './data/questions';
import { COMBO_TIERS, REGIONS, UPGRADES } from './data/upgrades';
import {
  ActiveModal,
  CompanionId,
  CompanionProgress,
  EvolutionStage,
  GameScreen,
  QuizQuestion,
  RegionId,
  UpgradeId,
  WorldEventTrigger,
} from './types/game';

interface SaveState {
  region: RegionId;
  activeCompanionId: CompanionId;
  companionsProgress: Record<CompanionId, CompanionProgress>;
  starCrystals: number;
  comboIndex: number;
  upgradeLevels: Record<UpgradeId, number>;
  hintCharges: number;
  harmonyShields: number;
  answeredIds: number[];
}

const SAVE_KEY = 'lumina_grove_ipa_save_v1';

function getInitialSaveState(): SaveState {
  const defaultState: SaveState = {
    region: 'pulau-damai',
    activeCompanionId: 'fluffox',
    companionsProgress: {
      fluffox: {
        unlocked: true,
        bondEnergy: 0,
        highestStage: 1,
        activeVisualStage: 1,
        energy: 85,
      },
      mossbun: {
        unlocked: false,
        bondEnergy: 0,
        highestStage: 1,
        activeVisualStage: 1,
        energy: 85,
      },
      aqualume: {
        unlocked: false,
        bondEnergy: 0,
        highestStage: 1,
        activeVisualStage: 1,
        energy: 85,
      },
      pyrokit: {
        unlocked: false,
        bondEnergy: 0,
        highestStage: 1,
        activeVisualStage: 1,
        energy: 85,
      },
    },
    starCrystals: 30,
    comboIndex: 0,
    upgradeLevels: {
      hintLantern: 0,
      harmonyCharm: 0,
      crystalMagnet: 0,
      sanctuaryHabitats: 0,
    },
    hintCharges: 2,
    harmonyShields: 0,
    answeredIds: [],
  };

  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return defaultState;
    const parsed = JSON.parse(raw) as Partial<SaveState>;
    return {
      ...defaultState,
      ...parsed,
      companionsProgress: {
        ...defaultState.companionsProgress,
        ...(parsed.companionsProgress || {}),
      },
      upgradeLevels: {
        ...defaultState.upgradeLevels,
        ...(parsed.upgradeLevels || {}),
      },
      answeredIds: Array.isArray(parsed.answeredIds) ? parsed.answeredIds : [],
    };
  } catch {
    return defaultState;
  }
}

export default function App() {
  const [save, setSave] = useState<SaveState>(getInitialSaveState);
  const [screen, setScreen] = useState<GameScreen>('title');
  const [activeModal, setActiveModal] = useState<ActiveModal>('none');
  const [deck, setDeck] = useState<QuizQuestion[]>(() =>
    shuffleQuestions(QUIZ_QUESTIONS),
  );
  const [deckCursor, setDeckCursor] = useState<number>(0);
  const [nearTotemId, setNearTotemId] = useState<number | null>(null);
  const [muted, setMuted] = useState<boolean>(false);
  const [ambientOn, setAmbientOn] = useState<boolean>(false);
  const [dockCollapsed, setDockCollapsed] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [worldEvent, setWorldEvent] = useState<WorldEventTrigger | null>(null);
  const streakForHintRef = useRef<number>(0);
  const toastTimerRef = useRef<number | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  }, []);

  // Persist save state
  useEffect(() => {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(save));
    } catch {
      // Ignore storage quota errors
    }
  }, [save]);

  // Passive Hot Spring energy regeneration when Sanctuary Habitats Lv >= 3
  useEffect(() => {
    if (screen !== 'playing' || save.upgradeLevels.sanctuaryHabitats < 3) {
      return;
    }
    const id = window.setInterval(() => {
      setSave((prev) => {
        const cur = prev.companionsProgress[prev.activeCompanionId];
        if (cur.energy >= 100) return prev;
        return {
          ...prev,
          companionsProgress: {
            ...prev.companionsProgress,
            [prev.activeCompanionId]: {
              ...cur,
              energy: Math.min(100, cur.energy + 3),
            },
          },
        };
      });
    }, 4500);
    return () => window.clearInterval(id);
  }, [screen, save.upgradeLevels.sanctuaryHabitats]);

  // Keyboard shortcuts (Esc, H, Enter on title)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (activeModal !== 'none') {
          setActiveModal('none');
          cozySynth.playClick();
        } else if (screen === 'playing') {
          setActiveModal('pause');
          cozySynth.playClick();
        }
      } else if (
        (e.key === 'h' || e.key === 'H') &&
        screen === 'playing' &&
        activeModal === 'none'
      ) {
        setDockCollapsed((prev) => !prev);
      } else if (
        (e.key === 'Enter' || e.key === ' ') &&
        screen === 'title' &&
        activeModal === 'none'
      ) {
        e.preventDefault();
        cozySynth.playClick();
        setScreen('playing');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [screen, activeModal]);

  const currentQuestion = useMemo(() => {
    return deck[deckCursor % deck.length];
  }, [deck, deckCursor]);

  const comboMultiplier = COMBO_TIERS[save.comboIndex];
  const activeCompanionProg = save.companionsProgress[save.activeCompanionId];

  const handleStartGame = () => {
    cozySynth.playClick();
    setScreen('playing');
    if (!ambientOn && !muted) {
      cozySynth.toggleAmbient(true);
      setAmbientOn(true);
    }
    showToast('Selamat datang! Klik tanah atau gunakan WASD untuk menjelajah.');
  };

  const handleChangeRegion = (rid: RegionId) => {
    if (rid === save.region) return;
    cozySynth.playClick();
    setSave((prev) => {
      const harmonyLv = prev.upgradeLevels.harmonyCharm;
      return {
        ...prev,
        region: rid,
        harmonyShields:
          harmonyLv >= 4 ? Math.max(prev.harmonyShields, 4) : prev.harmonyShields,
      };
    });
    showToast(`Berpindah ke ${REGIONS[rid].name}`);
  };

  const handleToggleMute = () => {
    const next = !muted;
    setMuted(next);
    cozySynth.setMuted(next);
  };

  const handleToggleAmbient = () => {
    const next = !ambientOn;
    setAmbientOn(next);
    cozySynth.toggleAmbient(next);
  };

  const handleCollectCrystal = useCallback(() => {
    setSave((prev) => {
      const magLv = prev.upgradeLevels.crystalMagnet;
      const bonusTable = [0, 0.2, 0.4, 0.65, 0.9];
      const gain = Math.round(5 * (1 + bonusTable[magLv]));
      return {
        ...prev,
        starCrystals: prev.starCrystals + gain,
      };
    });
  }, []);

  const handleUseHint = () => {
    cozySynth.playHint();
    setSave((prev) => ({
      ...prev,
      hintCharges: Math.max(0, prev.hintCharges - 1),
    }));
  };

  const handleAnswerQuiz = (isCorrect: boolean) => {
    const qId = currentQuestion.id;
    const magnetBonusTable = [0, 0.2, 0.4, 0.65, 0.9];
    const magMult = 1 + magnetBonusTable[save.upgradeLevels.crystalMagnet];
    const sanctuaryPassiveBond =
      save.upgradeLevels.sanctuaryHabitats >= 4 ? 10 : 0;

    if (isCorrect) {
      const nextComboIdx = Math.min(COMBO_TIERS.length - 1, save.comboIndex + 1);
      const activeMult = COMBO_TIERS[save.comboIndex];
      const earnedCrystals = Math.round(14 * activeMult * magMult);
      const earnedBond = Math.round(18 * activeMult * magMult) + sanctuaryPassiveBond;

      cozySynth.playCorrect(activeMult);
      setWorldEvent({
        type: 'correct',
        timestamp: Date.now(),
        elementColor: COMPANIONS[save.activeCompanionId].glowColor,
      });

      streakForHintRef.current += 1;
      const bonusHint =
        save.upgradeLevels.hintLantern >= 4 && streakForHintRef.current % 3 === 0
          ? 1
          : 0;

      setSave((prev) => {
        const curComp = prev.companionsProgress[prev.activeCompanionId];
        const nextBond = curComp.bondEnergy + earnedBond;
        const nextEnergy = Math.min(100, curComp.energy + 15);
        const answered = prev.answeredIds.includes(qId)
          ? prev.answeredIds
          : [...prev.answeredIds, qId];

        return {
          ...prev,
          starCrystals: prev.starCrystals + earnedCrystals,
          comboIndex: nextComboIdx,
          hintCharges: prev.hintCharges + bonusHint,
          answeredIds: answered,
          companionsProgress: {
            ...prev.companionsProgress,
            [prev.activeCompanionId]: {
              ...curComp,
              bondEnergy: nextBond,
              energy: nextEnergy,
            },
          },
        };
      });

      return {
        earnedCrystals,
        earnedBond,
        shieldUsed: false,
        newCombo: COMBO_TIERS[nextComboIdx],
      };
    } else {
      // Wrong answer: gentle feedback, drop only 1 combo tier unless Harmony Shield absorbs it
      cozySynth.playWrongGentle();
      streakForHintRef.current = 0;

      const shieldUsed = save.harmonyShields > 0;
      const nextComboIdx = shieldUsed
        ? save.comboIndex
        : Math.max(0, save.comboIndex - 1);
      const healOnSlip = save.upgradeLevels.harmonyCharm >= 3 ? 5 : 0;

      setSave((prev) => {
        const curComp = prev.companionsProgress[prev.activeCompanionId];
        return {
          ...prev,
          comboIndex: nextComboIdx,
          harmonyShields: shieldUsed
            ? prev.harmonyShields - 1
            : prev.harmonyShields,
          companionsProgress: {
            ...prev.companionsProgress,
            [prev.activeCompanionId]: {
              ...curComp,
              energy: Math.min(100, curComp.energy + healOnSlip),
            },
          },
        };
      });

      return {
        earnedCrystals: 0,
        earnedBond: 0,
        shieldUsed,
        newCombo: COMBO_TIERS[nextComboIdx],
      };
    }
  };

  const handleNextQuestion = () => {
    cozySynth.playClick();
    if (deckCursor + 1 >= deck.length) {
      setDeck(shuffleQuestions(QUIZ_QUESTIONS));
      setDeckCursor(0);
      showToast('Semua 80 soal telah terputar! Urutan soal diacak ulang.');
    } else {
      setDeckCursor((c) => c + 1);
    }
  };

  const handleSelectCompanion = (id: CompanionId) => {
    cozySynth.playClick();
    setSave((prev) => ({
      ...prev,
      activeCompanionId: id,
    }));
  };

  const handleUnlockCompanion = (id: CompanionId) => {
    const cost = COMPANIONS[id].unlockCost;
    if (save.starCrystals < cost) return;
    cozySynth.playEvolve();
    setSave((prev) => ({
      ...prev,
      starCrystals: prev.starCrystals - cost,
      activeCompanionId: id,
      companionsProgress: {
        ...prev.companionsProgress,
        [id]: {
          ...prev.companionsProgress[id],
          unlocked: true,
        },
      },
    }));
    setWorldEvent({
      type: 'evolve',
      timestamp: Date.now(),
      elementColor: COMPANIONS[id].glowColor,
    });
    showToast(`${COMPANIONS[id].name} bergabung sebagai pendamping baru!`);
  };

  const handleEvolveCompanion = (id: CompanionId) => {
    const prog = save.companionsProgress[id];
    const nextStage = (prog.highestStage + 1) as EvolutionStage;
    if (nextStage > 3) return;
    if (prog.bondEnergy < EVOLUTION_THRESHOLDS[nextStage]) return;

    cozySynth.playEvolve();
    setSave((prev) => ({
      ...prev,
      companionsProgress: {
        ...prev.companionsProgress,
        [id]: {
          ...prev.companionsProgress[id],
          highestStage: nextStage,
          activeVisualStage: nextStage,
          energy: 100,
        },
      },
    }));
    setWorldEvent({
      type: 'evolve',
      timestamp: Date.now(),
      elementColor: COMPANIONS[id].glowColor,
    });
    showToast(
      `${COMPANIONS[id].name} berevolusi menjadi ${STAGE_LABELS[nextStage]}!`,
    );
  };

  const handleSetVisualStage = (id: CompanionId, stage: EvolutionStage) => {
    if (stage > save.companionsProgress[id].highestStage) return;
    cozySynth.playClick();
    setSave((prev) => ({
      ...prev,
      companionsProgress: {
        ...prev.companionsProgress,
        [id]: {
          ...prev.companionsProgress[id],
          activeVisualStage: stage,
        },
      },
    }));
    showToast(
      `Wujud ${COMPANIONS[id].name} diubah ke ${STAGE_LABELS[stage]}`,
    );
  };

  const handleBuyUpgrade = (id: UpgradeId) => {
    const def = UPGRADES[id];
    const currentLv = save.upgradeLevels[id];
    if (currentLv >= def.maxLevel) return;
    const cost = def.costs[currentLv];
    if (save.starCrystals < cost) return;

    cozySynth.playUpgrade();
    const nextLv = currentLv + 1;

    setSave((prev) => {
      let extraHints = 0;
      let extraShields = 0;
      if (id === 'hintLantern') {
        extraHints = nextLv === 4 ? 2 : 1;
      }
      if (id === 'harmonyCharm') {
        extraShields = 1;
      }

      return {
        ...prev,
        starCrystals: prev.starCrystals - cost,
        hintCharges: prev.hintCharges + extraHints,
        harmonyShields: prev.harmonyShields + extraShields,
        upgradeLevels: {
          ...prev.upgradeLevels,
          [id]: nextLv,
        },
      };
    });

    if (id === 'sanctuaryHabitats') {
      showToast(
        nextLv === 1
          ? 'Gazebo Teh Hangat & Camilan Bintang terbuka di pulau!'
          : nextLv === 2
            ? 'Ayunan Cahaya Bintang terbuka di pulau!'
            : nextLv === 3
              ? 'Kolam Teratai Beruap terbuka di pulau!'
              : 'Suaka Santai mencapai Tingkat Maksimal!',
      );
    } else {
      showToast(`${def.name} ditingkatkan ke Level ${nextLv}!`);
    }
  };

  const handleFeedTreat = () => {
    if (save.upgradeLevels.sanctuaryHabitats < 1) {
      setActiveModal('upgrades');
      cozySynth.playClick();
      showToast('Buka Sanctuary Treats Lv.1 di Menu Peningkatan terlebih dahulu.');
      return;
    }
    if (save.starCrystals < 12) {
      cozySynth.playWrongGentle();
      showToast('Butuh 12 Kristal Bintang untuk Camilan Santai.');
      return;
    }
    const bonusMult = save.upgradeLevels.sanctuaryHabitats >= 2 ? 1.25 : 1.0;
    const bondGain = Math.round(22 * bonusMult);

    cozySynth.playTreat();
    setWorldEvent({
      type: 'treat',
      timestamp: Date.now(),
      elementColor: '#FF9EBB',
    });

    setSave((prev) => {
      const cur = prev.companionsProgress[prev.activeCompanionId];
      return {
        ...prev,
        starCrystals: prev.starCrystals - 12,
        companionsProgress: {
          ...prev.companionsProgress,
          [prev.activeCompanionId]: {
            ...cur,
            bondEnergy: cur.bondEnergy + bondGain,
            energy: Math.min(100, cur.energy + 25),
          },
        },
      };
    });
    showToast(`${COMPANIONS[save.activeCompanionId].name} menikmati camilan! +${bondGain} Bond`);
  };

  const handleReshuffleDeck = () => {
    cozySynth.playClick();
    setDeck(shuffleQuestions(QUIZ_QUESTIONS));
    setDeckCursor(0);
    setActiveModal('none');
    showToast('80 soal IPA berhasil diacak ulang!');
  };

  const handleResetProgress = () => {
    localStorage.removeItem(SAVE_KEY);
    setSave(getInitialSaveState());
    setDeck(shuffleQuestions(QUIZ_QUESTIONS));
    setDeckCursor(0);
    setActiveModal('none');
    setScreen('title');
    cozySynth.playClick();
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#17212b]">
      {/* Isolated 3D Isometric World Viewport */}
      <IsometricWorldCanvas
        screen={screen}
        region={save.region}
        companionId={save.activeCompanionId}
        visualStage={activeCompanionProg.activeVisualStage}
        magnetLevel={save.upgradeLevels.crystalMagnet}
        sanctuaryLevel={save.upgradeLevels.sanctuaryHabitats}
        modalOpen={activeModal !== 'none'}
        worldEvent={worldEvent}
        onNearTotemChange={setNearTotemId}
        onTriggerQuiz={() => setActiveModal('quiz')}
        onCollectCrystal={handleCollectCrystal}
      />

      {/* Title Screen */}
      {screen === 'title' && (
        <TitleScreen
          answeredCount={save.answeredIds.length}
          totalQuestions={QUIZ_QUESTIONS.length}
          onStart={handleStartGame}
          onOpenCompanions={() => {
            cozySynth.playClick();
            setActiveModal('companions');
          }}
          onOpenDeveloper={() => {
            cozySynth.playClick();
            setActiveModal('developer');
          }}
        />
      )}

      {/* Low-Occlusion Gameplay HUD */}
      {screen === 'playing' && (
        <HudOverlay
          region={save.region}
          companionId={save.activeCompanionId}
          companionProgress={activeCompanionProg}
          starCrystals={save.starCrystals}
          comboMultiplier={comboMultiplier}
          harmonyShields={save.harmonyShields}
          hintCharges={save.hintCharges}
          sanctuaryLevel={save.upgradeLevels.sanctuaryHabitats}
          nearTotemId={nearTotemId}
          answeredCount={save.answeredIds.length}
          totalQuestions={QUIZ_QUESTIONS.length}
          muted={muted}
          ambientOn={ambientOn}
          dockCollapsed={dockCollapsed}
          toastMessage={toastMessage}
          onToggleDock={() => setDockCollapsed((v) => !v)}
          onChangeRegion={handleChangeRegion}
          onToggleMute={handleToggleMute}
          onToggleAmbient={handleToggleAmbient}
          onOpenQuiz={() => {
            cozySynth.playClick();
            setActiveModal('quiz');
          }}
          onOpenCompanions={() => {
            cozySynth.playClick();
            setActiveModal('companions');
          }}
          onOpenUpgrades={() => {
            cozySynth.playClick();
            setActiveModal('upgrades');
          }}
          onFeedTreat={handleFeedTreat}
          onOpenPause={() => {
            cozySynth.playClick();
            setActiveModal('pause');
          }}
          onOpenDeveloper={() => {
            cozySynth.playClick();
            setActiveModal('developer');
          }}
        />
      )}

      {/* Modals */}
      {activeModal === 'quiz' && (
        <QuizModal
          question={currentQuestion}
          companionId={save.activeCompanionId}
          companionProgress={activeCompanionProg}
          comboMultiplier={comboMultiplier}
          hintCharges={save.hintCharges}
          hintLanternLevel={save.upgradeLevels.hintLantern}
          harmonyShields={save.harmonyShields}
          magnetLevel={save.upgradeLevels.crystalMagnet}
          sanctuaryLevel={save.upgradeLevels.sanctuaryHabitats}
          onUseHint={handleUseHint}
          onAnswer={handleAnswerQuiz}
          onNextQuestion={handleNextQuestion}
          onClose={() => {
            cozySynth.playClick();
            setActiveModal('none');
          }}
        />
      )}

      {activeModal === 'companions' && (
        <CompanionModal
          activeCompanionId={save.activeCompanionId}
          companionsProgress={save.companionsProgress}
          starCrystals={save.starCrystals}
          sanctuaryLevel={save.upgradeLevels.sanctuaryHabitats}
          onSelectCompanion={handleSelectCompanion}
          onUnlockCompanion={handleUnlockCompanion}
          onEvolveCompanion={handleEvolveCompanion}
          onSetVisualStage={handleSetVisualStage}
          onFeedTreat={handleFeedTreat}
          onClose={() => {
            cozySynth.playClick();
            setActiveModal('none');
          }}
        />
      )}

      {activeModal === 'upgrades' && (
        <UpgradesModal
          upgradeLevels={save.upgradeLevels}
          starCrystals={save.starCrystals}
          onBuyUpgrade={handleBuyUpgrade}
          onClose={() => {
            cozySynth.playClick();
            setActiveModal('none');
          }}
        />
      )}

      {activeModal === 'pause' && (
        <PauseModal
          answeredCount={save.answeredIds.length}
          totalQuestions={QUIZ_QUESTIONS.length}
          onResume={() => {
            cozySynth.playClick();
            setActiveModal('none');
          }}
          onReshuffleDeck={handleReshuffleDeck}
          onOpenDeveloper={() => {
            cozySynth.playClick();
            setActiveModal('developer');
          }}
          onBackToTitle={() => {
            cozySynth.playClick();
            setActiveModal('none');
            setScreen('title');
          }}
          onResetProgress={handleResetProgress}
        />
      )}

      {activeModal === 'developer' && (
        <DeveloperProfileModal
          totalQuestions={QUIZ_QUESTIONS.length}
          onClose={() => {
            cozySynth.playClick();
            setActiveModal('none');
          }}
        />
      )}
    </div>
  );
}
