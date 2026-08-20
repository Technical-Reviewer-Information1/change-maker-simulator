(function () {
  'use strict';
  const C = window.Chart, T = window.Tools, $ = id => document.getElementById(id);

  const PAT = r => r < 0.5 ? 'a' : (r < 0.8 ? 'b' : 'c');
  const PATNAME = { a: '100円3枚（釣り銭なし）', b: '500円1枚（100円2枚を渡す）', c: '1000円1枚' };

  /** 1人分の会計を処理する。state は {c100, c500, c1000} */
  function serve(state, r) {
    const p = PAT(r);
    const log = { r, p, give: '' };
    if (p === 'a') { state.c100 += 3; log.give = 'なし'; }
    else if (p === 'b') { state.c500 += 1; state.c100 -= 2; log.give = '100円2枚'; }
    else {
      state.c1000 += 1;
      if (state.c500 >= 1) { state.c500 -= 1; state.c100 -= 2; log.give = '500円1枚と100円2枚'; }
      else { state.c100 -= 7; log.give = '100円7枚'; }
    }
    log.after = { c100: state.c100, c500: state.c500, c1000: state.c1000 };
    return log;
  }

  /* ---------- STEP1 乱数 ---------- */
  let rolls = [];
  function roll(n) {
    for (let i = 0; i < n; i++) {
      const r = Math.random();
      rolls.unshift({ r, p: PAT(r) });
    }
    rolls = rolls.slice(0, 20);
    const last = rolls[0];
    $('dice').innerHTML = last.r.toFixed(3) + '<small>→ パターン <strong>' + last.p + '</strong>：' + PATNAME[last.p] + '</small>';
    $('marker').style.left = (last.r * 100) + '%';
    const cnt = { a: 0, b: 0, c: 0 };
    rolls.forEach(x => cnt[x.p]++);
    $('rollTable').innerHTML = '<thead><tr><th>乱数</th><th>パターン</th></tr></thead><tbody>' +
      rolls.slice(0, 10).map(x => '<tr><td class="mono">' + x.r.toFixed(3) + '</td><td>' + x.p + '</td></tr>').join('') + '</tbody>';
    const n2 = $('diceNote');
    n2.className = 'note info';
    n2.innerHTML = '直近 ' + rolls.length + ' 回の内訳： a ' + cnt.a + ' 回 / b ' + cnt.b + ' 回 / c ' + cnt.c + ' 回。' +
      '<br>ねらいは 50％・30％・20％ですが、<strong>回数が少ないうちは割合がずれます</strong>。何度も押すと近づいていきます。';
  }

  /* ---------- STEP2 本文と同じ3人 ---------- */
  const FIXED = [0.529, 0.171, 0.871];
  let cust = 0, state = { c100: 0, c500: 0, c1000: 0 }, logs = [];
  function resetCust() {
    cust = 0; state = { c100: 0, c500: 0, c1000: 0 };
    logs = [{ n: 0, r: null, p: null, give: '—', after: { c100: 0, c500: 0, c1000: 0 } }];
    drawCust();
  }
  function nextCust() {
    if (cust >= FIXED.length) return;
    const r = FIXED[cust];
    const l = serve(state, r);
    logs.push({ n: cust + 1, r: l.r, p: l.p, give: l.give, after: l.after });
    cust++;
    drawCust();
  }
  function drawCust() {
    const cur = logs[logs.length - 1];
    $('coins').innerHTML = [['100円', cur.after.c100], ['500円', cur.after.c500], ['1000円', cur.after.c1000]]
      .map(([k, v]) => '<div class="coin' + (v < 0 ? ' neg' : '') + '"><div class="k">' + k + '</div><div class="v">' +
        (v > 0 ? '+' : '') + v + '</div></div>').join('');
    $('custBadge').textContent = cust + ' / ' + FIXED.length + ' 人目まで';
    $('nextCust').disabled = cust >= FIXED.length;
    if (cust === 0) {
      $('stepBox').innerHTML = '開店前。釣り銭は<strong>すべて0枚</strong>です。<br>' +
        '<span style="font-family:var(--font);font-size:.85rem;color:var(--ink-2)">「次の客へ」を押す前に、1人目でどうなるか予想してみましょう。</span>';
    } else {
      const l = logs[cust];
      $('stepBox').innerHTML = '<strong>' + cust + '人目</strong>　乱数 ' + l.r.toFixed(3) + ' → パターン <strong>' + l.p + '</strong><br>' +
        PATNAME[l.p] + ' で支払い、店は「' + l.give + '」を渡しました。<br>' +
        '→ 100円 <strong>' + l.after.c100 + '枚</strong>、500円 <strong>' + l.after.c500 +
        '枚</strong>、1000円 <strong>' + l.after.c1000 + '枚</strong>' +
        (l.after.c100 < 0 || l.after.c500 < 0
          ? '<br><span style="color:var(--ng);font-family:var(--font);font-size:.85rem">マイナスは釣り銭が不足している状態です。</span>' : '');
    }
    $('simTable').innerHTML = '<thead><tr><th>客</th><th>生成乱数</th><th>パターン</th><th>渡した釣り銭</th><th>100円</th><th>500円</th><th>1000円</th></tr></thead><tbody>' +
      logs.map(l => '<tr class="' + (l.n === cust ? 'now' : '') + '"><td>' + l.n + '</td><td>' +
        (l.r == null ? '—' : l.r.toFixed(3)) + '</td><td>' + (l.p || '—') + '</td><td>' + l.give + '</td>' +
        ['c100', 'c500', 'c1000'].map(k => '<td class="' + (l.after[k] < 0 ? 'neg' : '') + '">' + l.after[k] + '</td>').join('') +
        '</tr>').join('') + '</tbody>';
  }

  /* ---------- STEP3 100人 ---------- */
  function runOnce(init100, init500, n) {
    const st = { c100: init100, c500: init500, c1000: 0 };
    const h100 = [st.c100], h500 = [st.c500], h1000 = [0];
    let short = 0;
    for (let i = 0; i < n; i++) {
      serve(st, Math.random());
      if (st.c100 < 0 || st.c500 < 0) short++;
      h100.push(st.c100); h500.push(st.c500); h1000.push(st.c1000);
    }
    return { h100, h500, h1000, short, min100: Math.min(...h100), min500: Math.min(...h500) };
  }
  function run100() {
    const i1 = +$('init100').value, i5 = +$('init500').value, n = +$('nCust').value;
    $('init100V').textContent = i1; $('init500V').textContent = i5; $('nCustV').textContent = n;
    const res = runOnce(i1, i5, n);
    $('min100').textContent = res.min100;
    $('min500').textContent = res.min500;
    $('shortCnt').textContent = res.short;
    C.line($('runChart'), { W: 780, H: 320,
      labels: res.h100.map((_, i) => (i % Math.ceil(n / 12) === 0 ? i + '' : '')),
      series: [
        { name: '100円', values: res.h100, color: '#123a6b' },
        { name: '500円', values: res.h500, color: '#8a5a00' },
        { name: '1000円', values: res.h1000, color: '#1f7a3d' }
      ], unit: '枚' });
    const nt = $('runNote');
    nt.className = res.short ? 'note ng' : 'note ok';
    nt.innerHTML = res.short
      ? '<strong>' + res.short + ' 回、釣り銭が不足しました。</strong>いちばん足りなかったのは 100円が ' + res.min100 +
        ' 枚、500円が ' + res.min500 + ' 枚のときです。はじめに用意する枚数を増やして試してください。'
      : '<strong>最後まで不足しませんでした。</strong>ただし確率的モデルなので、もう一度実行すると結果が変わります。' +
        '「100回くり返して調べる」で確かめましょう。';
    $('runTools').innerHTML = '';
    $('runTools').appendChild(T.saveButton(() => $('runChart').querySelector('svg'), '釣り銭枚数の変化'));
  }
  function run100x() {
    const i1 = +$('init100').value, i5 = +$('init500').value, n = +$('nCust').value;
    let bad = 0, worst100 = 99, worst500 = 99;
    for (let k = 0; k < 100; k++) {
      const r = runOnce(i1, i5, n);
      if (r.short) bad++;
      worst100 = Math.min(worst100, r.min100);
      worst500 = Math.min(worst500, r.min500);
    }
    const nt = $('runNote');
    nt.className = bad === 0 ? 'note ok' : (bad < 10 ? 'note warn' : 'note ng');
    nt.innerHTML = '100回くり返した結果：<strong>' + bad + ' 回</strong>で釣り銭が不足しました（' + (100 - bad) +
      '％は足りた）。<br>もっとも足りなかったときで、100円 <strong>' + worst100 + ' 枚</strong>、500円 <strong>' +
      worst500 + ' 枚</strong>。<br>' +
      (bad === 0 ? 'この枚数を用意しておけば、まず安心といえます。'
                 : '不足を防ぐには、100円を <strong>' + Math.max(0, i1 - worst100) + ' 枚以上</strong>、500円を <strong>' +
                   Math.max(0, i5 - worst500) + ' 枚以上</strong> 用意する必要があります。');
  }

  /* ---------- STEP4 必要枚数 ---------- */
  function findNeed() {
    const n = +$('nCust').value;
    const rows = [];
    for (const c500 of [0, 5, 10, 15, 20]) {
      for (const c100 of [0, 10, 20, 30, 40]) {
        let bad = 0;
        for (let k = 0; k < 100; k++) if (runOnce(c100, c500, n).short) bad++;
        rows.push({ c100, c500, ok: 100 - bad });
      }
    }
    $('needTable').innerHTML = '<thead><tr><th>500円 ＼ 100円</th>' +
      [0, 10, 20, 30, 40].map(x => '<th>' + x + '枚</th>').join('') + '</tr></thead><tbody>' +
      [0, 5, 10, 15, 20].map(c5 => '<tr><td>' + c5 + '枚</td>' +
        [0, 10, 20, 30, 40].map(c1 => {
          const r = rows.find(x => x.c100 === c1 && x.c500 === c5);
          const col = r.ok === 100 ? 'var(--ok-bg)' : (r.ok >= 90 ? 'var(--warn-bg)' : 'var(--ng-bg)');
          return '<td class="mono" style="background:' + col + '">' + r.ok + '％</td>';
        }).join('') + '</tr>').join('') + '</tbody>';
    const safe = rows.filter(r => r.ok === 100).sort((a, b) => (a.c100 + a.c500 * 5) - (b.c100 + b.c500 * 5))[0];
    const nt = $('needNote');
    nt.hidden = false;
    nt.className = safe ? 'note ok' : 'note warn';
    nt.innerHTML = '各条件で ' + n + ' 人分を100回ずつ試し、<strong>1度も不足しなかった割合</strong>を表にしました。' +
      (safe ? '<br>いちばん少ない用意で100％足りたのは <strong>100円 ' + safe.c100 + ' 枚、500円 ' + safe.c500 +
        ' 枚</strong>です。' : '<br>この範囲では100％足りる条件が見つかりませんでした。もっと多く用意する必要があります。') +
      '<br><span style="color:var(--ink-2)">※ 実行のたびに数値は少し変わります。確率的モデルだからです。</span>';
  }

  /* ---------- STEP5 クイズ ---------- */
  const QUIZ = [
    { t: '乱数0.529が出た。客はどのパターンで支払うか。',
      choices: ['b（500円1枚）', 'a（100円3枚）', 'c（1000円1枚）', '判断できない'], a: 'b（500円1枚）',
      why: '0.5以上0.8未満なのでパターンbです。割合50％・30％・20％を、0〜0.5、0.5〜0.8、0.8〜1 と累積で区切ります。' },
    { t: '釣り銭がすべて0枚の状態で、1人目が500円1枚で支払った。100円の枚数はどうなるか。',
      choices: ['−2枚', '+2枚', '0枚', '+1枚'], a: '−2枚',
      why: '100円2枚を釣り銭として渡すので、手元は 0 − 2 ＝ −2枚。マイナスは不足を表します。' },
    { t: '500円の釣り銭が0枚のとき、1000円で支払う客が来た。店はどう渡すか。',
      choices: ['100円7枚', '500円1枚と100円2枚', '釣り銭を渡さない', '1000円をそのまま返す'], a: '100円7枚',
      why: '条件表のとおり、500円が1枚未満のときは100円7枚で700円を渡します。100円の消費が一気に増えるので、不足しやすくなります。' },
    { t: '同じ条件でシミュレーションを2回実行したら、結果がちがった。なぜか。',
      choices: ['乱数を使う確率的モデルだから', 'プログラムにまちがいがあるから',
                '客の人数がちがうから', 'コンピュータの計算誤差のため'], a: '乱数を使う確率的モデルだから',
      why: '客の支払い方を乱数で決めているので、実行のたびに並びが変わります。だから何度も実行して傾向をつかみます。' },
    { t: '「500円を20枚用意しておけば不足しない」と言い切ってよいか。',
      choices: ['1回の結果だけでは言えない', '1回でも不足しなければ言える',
                'グラフが右上がりなら言える', '客が100人なら必ず言える'], a: '1回の結果だけでは言えない',
      why: '確率的モデルでは、たまたま足りただけかもしれません。何度もくり返して、不足しない割合を確かめる必要があります。' },
    { t: '釣り銭の枚数が時間とともに増え続けるのはどの硬貨か。',
      choices: ['1000円札（受け取るだけで渡さない）', '100円（渡すだけ）',
                '500円（受け取りも支払いもある）', 'どれも増え続けない'], a: '1000円札（受け取るだけで渡さない）',
      why: '1000円は受け取るだけで釣り銭には使わないので、増える一方です。100円は渡す機会が多く減りやすく、500円は増減の両方があります。' }
  ];
  let qList = [], qi = 0, qScore = 0;
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  function startQuiz() { qList = shuffle(QUIZ); qi = 0; qScore = 0; renderQ(); }
  function renderQ() {
    if (qi >= qList.length) {
      $('qText').textContent = qScore + ' / ' + qList.length + ' 問正解';
      $('qChoices').innerHTML = ''; $('qFb').hidden = true; $('qNext').disabled = true;
      $('qProgress').textContent = qList.length + ' / ' + qList.length; return;
    }
    const it = qList[qi];
    $('qProgress').textContent = (qi + 1) + ' / ' + qList.length;
    $('qScore').textContent = qScore;
    $('qText').textContent = it.t;
    const box = $('qChoices'); box.className = 'choice4'; box.innerHTML = '';
    shuffle(it.choices).forEach(c => {
      const b = document.createElement('button');
      b.className = 'btn'; b.textContent = c; b.dataset.c = c;
      b.addEventListener('click', () => answerQ(c));
      box.appendChild(b);
    });
    $('qFb').hidden = true; $('qNext').disabled = true;
    $('qNext').textContent = (qi === qList.length - 1) ? '結果を見る' : '次の問題';
  }
  function answerQ(c) {
    const it = qList[qi], ok = c === it.a, box = $('qChoices');
    box.classList.add('locked');
    [...box.children].forEach(b => {
      if (b.dataset.c === it.a) b.classList.add('correct');
      else if (b.dataset.c === c) b.classList.add('wrong');
    });
    if (ok) qScore++;
    const fb = $('qFb');
    fb.className = 'note ' + (ok ? 'ok' : 'ng');
    fb.innerHTML = (ok ? '正解。' : '正解は「<strong>' + it.a + '</strong>」。') + it.why;
    fb.hidden = false;
    $('qScore').textContent = qScore; $('qNext').disabled = false;
  }

  function init() {
    $('roll').addEventListener('click', () => roll(1));
    $('roll20').addEventListener('click', () => roll(20));
    $('nextCust').addEventListener('click', nextCust);
    $('resetCust').addEventListener('click', resetCust);
    ['init100', 'init500', 'nCust'].forEach(i => $(i).addEventListener('input', () => {
      $('init100V').textContent = $('init100').value;
      $('init500V').textContent = $('init500').value;
      $('nCustV').textContent = $('nCust').value;
    }));
    $('run100').addEventListener('click', run100);
    $('run100x').addEventListener('click', run100x);
    $('findNeed').addEventListener('click', findNeed);
    $('qNext').addEventListener('click', () => { qi++; renderQ(); });
    $('qReset').addEventListener('click', startQuiz);
    window.Terms.glossary($('glossBox'), ['乱数', '確率的モデル', '確定的モデル', 'シミュレーション', 'モデル化', 'パラメータ', '相対度数']);
    roll(1); resetCust(); run100(); startQuiz();
    window.Terms.attach();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
