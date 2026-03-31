/**
 * @typedef {{ id: string, text: string }} Sentence
 * @typedef {{ id: string, name?: string }} Emotion
 * @typedef {{ textId: string, text: string, emotion: string }} RecordingTask
 */

/** @param {string | undefined | null} emotion */
export function normalizeEmotion(emotion) {
  if (!emotion) return '';
  if (emotion === 'fear') return 'fearful';
  if (emotion === 'surprise') return 'surprised';
  return emotion;
}

/**
 * @param {Sentence[]} sentences
 * @param {Emotion[]} emotions
 * @param {{textId?: string, emotion?: string}[]} existing
 * @returns {RecordingTask[]}
 */
export function buildPendingTasks(sentences, emotions, existing) {
  const recordedPairs = new Set(
    existing.map((item) => `${item.textId || ''}::${normalizeEmotion(item.emotion)}`)
  );

  /** @type {RecordingTask[]} */
  const pending = [];
  sentences.forEach((sentence) => {
    emotions.forEach((emotion) => {
      const key = `${sentence.id}::${emotion.id}`;
      if (!recordedPairs.has(key)) {
        pending.push({ textId: sentence.id, text: sentence.text, emotion: emotion.id });
      }
    });
  });

  return pending;
}

/**
 * @param {Sentence[]} sentences
 * @param {RecordingTask[]} pending
 */
export function buildSentenceOptions(sentences, pending) {
  const counter = new Map();
  pending.forEach((task) => {
    counter.set(task.textId, (counter.get(task.textId) || 0) + 1);
  });

  return sentences
    .map((sentence) => ({ textId: sentence.id, label: sentence.text, remaining: counter.get(sentence.id) || 0 }))
    .filter((item) => item.remaining > 0);
}
