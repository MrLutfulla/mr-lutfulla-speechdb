import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeEmotion, buildPendingTasks, buildSentenceOptions } from '../src/lib/recording-task-utils.js';

test('normalizeEmotion maps legacy ids', () => {
  assert.equal(normalizeEmotion('fear'), 'fearful');
  assert.equal(normalizeEmotion('surprise'), 'surprised');
  assert.equal(normalizeEmotion('happy'), 'happy');
  assert.equal(normalizeEmotion(''), '');
});

test('buildPendingTasks excludes already recorded sentence-emotion pairs', () => {
  const sentences = [
    { id: 's1', text: 'Sentence 1' },
    { id: 's2', text: 'Sentence 2' },
  ];
  const emotions = [
    { id: 'happy' },
    { id: 'fearful' },
  ];

  const existing = [{ textId: 's1', emotion: 'fear' }]; // legacy id
  const pending = buildPendingTasks(sentences, emotions, existing);

  assert.equal(pending.length, 3);
  assert.equal(pending.some((item) => item.textId === 's1' && item.emotion === 'fearful'), false);
});

test('buildSentenceOptions returns only sentences with remaining tasks', () => {
  const sentences = [
    { id: 's1', text: 'A' },
    { id: 's2', text: 'B' },
  ];
  const pending = [{ textId: 's2', text: 'B', emotion: 'happy' }];
  const options = buildSentenceOptions(sentences, pending);

  assert.deepEqual(options, [{ textId: 's2', label: 'B', remaining: 1 }]);
});
