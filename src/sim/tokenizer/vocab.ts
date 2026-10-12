/**
 * Toy word-level vocabulary: ~300 common English words. Real word-level tokenizers used
 * 50k–100k+ entries and still hit unknown words; the lab says so in its simplifications.
 * Index in this list = token id. Id 0 is reserved for [UNK].
 */
export const WORD_VOCAB: readonly string[] = (
  '[UNK] the be to of and a in that have i it for not on with he as you do at this but his by from they we ' +
  'say her she or an will my one all would there their what so up out if about who get which go me when make ' +
  'can like time no just him know take people into year your good some could them see other than then now look ' +
  'only come its over think also back after use two how our work first well way even new want because any these ' +
  'give day most us is was are were been has had did said says made went got am being cat dog sat mat tired ' +
  'tree house car book word words world hello name very long short big small little old young man woman child ' +
  'children love life hand eye place thing things same different few many much more less own right left high low ' +
  'next last great real still never always often here where why yes ok thank thanks please sorry today tomorrow ' +
  'yesterday morning night home school water food money friend family city country number part house light dark ' +
  'red blue green black white let i total return function true false null if else for while print code model ' +
  'models text token tokens language computer machine learning read write reads writes reading writing learn learns ' +
  'ai data train trained training run runs ran fast slow small large word piece pieces split splits into every ' +
  'each should must may might shall can\'t don\'t isn\'t it\'s i\'m doctor teacher said tell told ask asked find ' +
  'found keep kept start started end ended show shown try tried call called need needs feel felt become became ' +
  'leave left put mean means seem seemed help helped talk talked turn turned play played move moved live lived ' +
  'believe brought happen happened sit stand lose lost pay paid meet met include continue set learn change lead ' +
  'understand watch follow stop create speak read allow add spend grow open walk win offer remember consider appear ' +
  'buy wait serve die send expect build stay fall cut reach kill remain suggest raise pass sell require report decide pull ' +
  // Punctuation and symbols get entries too, so only genuinely unknown words become [UNK].
  '. , ! ? ; : \' " ( ) [ ] { } - + = * / < > _ & % $ # @'
).split(' ');

const index = new Map<string, number>();
WORD_VOCAB.forEach((w, i) => {
  if (!index.has(w)) index.set(w, i);
});

/** Number of distinct entries (the list above repeats a few common words). */
export const WORD_VOCAB_SIZE = index.size;

/** Lowercased lookup; returns 0 ([UNK]) for anything not in the toy vocabulary. */
export const wordId = (word: string): number => index.get(word.toLowerCase()) ?? 0;
