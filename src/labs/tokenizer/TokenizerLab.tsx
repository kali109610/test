import { useCallback, useEffect, useMemo } from 'react';
import { LabShell } from '../../framework/LabShell';
import { makeSim } from '../../sim/tokenizer';
import { useProgress } from '../../store/progressStore';
import { PREDICT_WORD, tokenizerLab } from './definition';
import { ContextDial, PresetPicker, Scene } from './Scene';
import { useTokenizerLab } from './store';

const lab = { ...tokenizerLab, order: 1 };

export default function TokenizerLab() {
  const s = useTokenizerLab();
  const sim = useMemo(() => makeSim(s.text, s.contextLimit, s.inspected), [s.text, s.contextLimit, s.inspected]);
  const openExplanation = useProgress((p) => p.openExplanation);

  useEffect(() => {
    if (s.lastTouched) openExplanation(lab.id, s.lastTouched);
  }, [s.lastTouched, openExplanation]);

  const { drop, hold, select, nudgeContext, selected } = s;
  const onEscape = useCallback(() => {
    hold(null);
    select(null);
  }, [hold, select]);
  const onNudge = useCallback((dir: -1 | 1) => selected === 'context' && nudgeContext(dir), [selected, nudgeContext]);

  return (
    <LabShell
      lab={lab}
      sim={sim}
      scene={<Scene sim={sim} />}
      controls={{ presets: <PresetPicker />, context: <ContextDial /> }}
      step={s.step}
      onStep={s.setStep}
      lastTouched={s.lastTouched}
      onReset={s.reset}
      onReplay={s.replay}
      onEscape={onEscape}
      onNudge={onNudge}
      onShowWhatHappens={() => {
        drop('bpe', PREDICT_WORD);
        document.querySelector('[data-lane="bpe"]')?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }}
    />
  );
}
