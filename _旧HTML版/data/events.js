// イベント：作業を発生させる出来事
//   domain : 主に関わる業務領域
//   items  : 発生する作業（data/domains.js の作業 id）を順に並べる。note で補足できる
window.DATA = window.DATA || {};
window.DATA.events = [
  { id: "e-law", name: "法改正対応", domain: "deploy",
    desc: "法改正に伴うアプリケーションのバージョンアップ。",
    items: [{ task: "d-assets" }, { task: "d-procedure" }, { task: "c-schedule" }, { task: "d-execute" }, { task: "c-issues" }] },
  { id: "e-training", name: "実機研修", domain: "deploy",
    desc: "研修環境の準備。",
    items: [{ task: "d-assets" }, { task: "d-procedure" }, { task: "c-schedule" }, { task: "d-execute" }], status: "要確認" },
  { id: "e-optest", name: "運用テスト前の最新化", domain: "deploy",
    desc: "運用テストに向けて環境を最新化する。",
    items: [{ task: "d-assets" }, { task: "d-procedure" }, { task: "c-schedule" }, { task: "d-execute" }], status: "要確認" },
  { id: "e-sogo", name: "総合テスト", domain: "other",
    desc: "業務システム全体の受け入れテスト。",
    items: [{ task: "d-execute", note: "総合テスト前のバージョンアップ" }, { task: "m-mask" }, { task: "x-test" }] },
  { id: "e-pkgvu", name: "パッケージのバージョンアップ", domain: "ops",
    desc: "稼働中システムのバージョンアップ。",
    items: [{ task: "o-accept" }, { task: "o-ringi" }, { task: "d-execute", note: "本番環境の更新" }], status: "要確認" },
  { id: "e-toolrel", name: "移行ツールのリリース", domain: "migration",
    desc: "開発元が移行ツールの新版をリリースする。アプリのバージョンアップに伴うものと、移行仕様の修正によるものがある。",
    items: [{ task: "m-tool" }, { task: "m-assets" }] },
  { id: "e-alltest", name: "全体移行テスト", domain: "migration",
    desc: "移行の通しテスト。",
    items: [{ task: "m-run" }, { task: "m-verify" }, { task: "c-issues" }], status: "要確認" },
  { id: "e-rehearsal", name: "リハーサル", domain: "migration",
    desc: "本番切替の予行。手順書と所要時間を検証する。",
    items: [{ task: "m-run" }, { task: "m-verify" }, { task: "c-issues" }], status: "要確認" },
  { id: "e-cutover", name: "本番切替", domain: "migration",
    desc: "閉庁日（土日祝）に標準準拠システムへ切り替える。",
    items: [{ task: "m-run" }, { task: "m-gonogo" }, { task: "m-verify" }] },
  { id: "e-adhoc", name: "標準化関連の随時依頼", domain: "other",
    desc: "プロパーからのブリーフィングで発生する依頼。",
    items: [{ task: "x-adhoc" }, { task: "x-test" }, { task: "x-limit" }] }
];
