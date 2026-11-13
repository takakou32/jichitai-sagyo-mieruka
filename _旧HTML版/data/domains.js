// 業務領域 → 作業（型） → ステップ
//
// ステップの書き方
//   title  : ステップ名
//   role   : 担当の役割（data/master.js の roles の name）
//   kind   : 定型 / 判断 / 調整
//   detail : 内容（任意）
//   judge  : 判断ステップのみ。{ scope: 責任範囲, who: 判断者, basis: 根拠 }
//            判断者が決まっていなければ who: "未定義"、現状を current に書く
//   next   : 省略すると次のステップへ進む。分岐は [{ to: ステップid, label: "..." }]、終わりは []
//   status : 推測で書いたものは "要確認"
window.DATA = window.DATA || {};
window.DATA.domains = [
  {
    id: "deploy", name: "アプリケーションのデプロイ",
    desc: "業務アプリケーションの各環境への構築・バージョンアップ。法改正対応、研修、テスト前の最新化など、きっかけは多いが流れはほぼ同じ。",
    tasks: [
      { id: "d-assets", name: "資産のとりまとめ", output: "デプロイ資産一式",
        purpose: "デプロイに使う資産を集め、版と取得元を揃える。" },
      { id: "d-procedure", name: "手順書の作成・更新", output: "デプロイ手順書",
        purpose: "デプロイ手順書を作成・更新する。" },
      { id: "d-execute", name: "デプロイ実施", output: "更新済みの環境",
        purpose: "手順書に従ってデプロイし、結果を確認する。",
        steps: [
          { title: "デプロイ実施", role: "作業者", kind: "定型", detail: "手順書に従って対象環境へデプロイする。" },
          { title: "結果の確認", role: "作業者", kind: "定型", status: "要確認" },
          { title: "環境バージョン一覧の更新", role: "作業者", kind: "定型", detail: "対象環境の資産バージョンを一覧に反映する。" }
        ] }
    ]
  },
  {
    id: "migration", name: "データ移行",
    desc: "現行システムから標準準拠システムへのデータ移行。移行ツールは開発元から定期的にリリースされる。",
    tasks: [
      { id: "m-tool", name: "移行ツールの取り込み", output: "使える状態の移行ツール",
        purpose: "開発元がリリースした移行ツールの新版を、実際に使える状態にする。アプリのバージョンアップに伴うものと、移行仕様の修正によるものがある。",
        steps: [
          { title: "とりまとめ", role: "作業者", kind: "定型", detail: "新版の資産を集め、GUI（iko_gui）にセットする。", status: "要確認" },
          { title: "カスタマイズとのマージ", role: "リーダー", kind: "判断",
            detail: "自分たちのカスタマイズと新版をマージする。",
            judge: { scope: "自分たち", who: "リーダー", basis: "カスタマイズの経緯・移行仕様" }, status: "要確認" },
          { title: "テスト", role: "作業者", kind: "定型", status: "要確認" },
          { title: "他セクションへの共有", role: "リーダー", kind: "調整",
            detail: "本番切替当日に他セクションが使う移行ツールの版を、取り込んだ版と一致させる。" }
        ] },
      { id: "m-assets", name: "移行資産・手順の更新", output: "移行資産・移行手順書",
        purpose: "移行資産と移行手順書を更新する。版の管理は共通作業「版の管理」で行う。" },
      { id: "m-run", name: "移行実行", output: "移行済みDB・作業ログ",
        purpose: "移行ツールを実行してデータを移行し、ログで成否を確認する。全体移行テスト・リハーサル・本番切替で使う。",
        steps: [
          { title: "抽出CSVの配置", role: "作業者", kind: "定型", detail: "ファイルサーバから抽出CSVを取得し、所定の場所に置く。" },
          { title: "移行ツール実行", role: "作業者", kind: "定型", detail: "iko_gui から移行ツールを順に実行する。" },
          { title: "移行ツール実行（住記等）", role: "他セクション", kind: "定型",
            detail: "本番切替当日は、住記などの移行ツールの実行を他セクションが行う。実行順序のハンドリングのため。" },
          { title: "ログ格納", role: "作業者", kind: "定型", detail: "ログを集約し、ログ格納先へアップロードする。" },
          { title: "ログ・件数の確認", role: "確認者（プロパー）", kind: "判断",
            detail: "アップロードされたログとDBで、エラーと件数を確認する。",
            judge: { scope: "委託元", who: "確認者（プロパー）", basis: "確認観点（リーダーが策定）" } },
          { title: "致命的なエラーかの判断", role: "委託元", kind: "判断",
            detail: "エラーが出たとき、作業を続けられるかを判断する。",
            judge: { scope: "委託元", who: "未定義", basis: "未定義",
              current: "その場にいるメンバー（リーダー含む）で判断している" } }
        ] },
      { id: "m-gonogo", name: "Go/No-Go判定", output: "判定結果",
        purpose: "切替を確定させるか、切り戻すかを判定する。",
        steps: [
          { id: "g1", title: "判断材料の整理", role: "リーダー", kind: "定型",
            detail: "エラーの状況、切り戻しに要する時間、判断期限をまとめて判断者に渡す。" },
          { id: "g2", title: "Go/No-Go判定", role: "委託元", kind: "判断",
            judge: { scope: "委託元", who: "未定義", basis: "未定義",
              current: "判断者・判断期限・判断基準が決まっていない" },
            next: [{ to: "g3", label: "No-Go" }, { to: "g4", label: "Go" }] },
          { id: "g3", title: "切り戻し", role: "作業者", kind: "定型", detail: "切り戻し手順に従って元に戻す。", next: [] },
          { id: "g4", title: "稼働報告", role: "リーダー", kind: "調整", status: "要確認", next: [] }
        ] },
      { id: "m-verify", name: "移行結果の確認", output: "自治体への移行結果報告資料",
        purpose: "自治体へ報告するために、移行前後のデータを比較する。観点・比較対象・比較方法は確立している。",
        note: "移行実行の中の「ログ・件数の確認」とは別物。全体像の把握、差異への対応、想定外の事象など判断が多く、要員交代の影響をいちばん受ける。",
        steps: [
          { title: "前後比較", role: "作業者", kind: "定型", detail: "確立した観点・方法で移行前後を比較する。" },
          { title: "差異の分析", role: "リーダー", kind: "判断",
            judge: { scope: "自分たち", who: "リーダー", basis: "業務知識・過去の事例" } },
          { title: "業務知識の収集", role: "有識者", kind: "調整", detail: "差異の原因を判断するために、有識者から業務知識を集める。" },
          { title: "報告資料の作成", role: "作業者", kind: "定型" }
        ] },
      { id: "m-mask", name: "マスキングデータの抽出・取込", output: "開発環境DBのテストデータ",
        purpose: "総合テスト用に、特定団体のデータの個人情報をマスキングして開発環境DBに取り込む。",
        steps: [
          { title: "特定団体のデータ抽出", role: "作業者", kind: "定型" },
          { title: "個人情報のマスキング", role: "作業者", kind: "定型" },
          { title: "マスキング漏れの確認", role: "リーダー", kind: "判断",
            detail: "漏れがあると、開発環境に個人情報がそのまま入る。",
            judge: { scope: "自分たち", who: "リーダー", basis: "マスキング仕様" }, status: "要確認" },
          { title: "開発環境DBへの取込", role: "作業者", kind: "定型" }
        ] }
    ]
  },
  {
    id: "ops", name: "運用支援",
    desc: "稼働中システムのバージョンアップとトラブル対応。",
    tasks: [
      { id: "o-accept", name: "受け入れ検証", output: "検証結果",
        purpose: "パッケージの改修内容を分析し、受け入れ検証を行う。",
        steps: [
          { title: "改修内容の分析", role: "リーダー", kind: "判断",
            judge: { scope: "自分たち", who: "リーダー", basis: "改修内容・業務知識" }, status: "要確認" },
          { title: "検証項目の作成", role: "作業者", kind: "定型", status: "要確認" },
          { title: "検証", role: "作業者", kind: "定型" }
        ] },
      { id: "o-ringi", name: "稟議書類の作成", output: "本番環境更新の稟議書類",
        purpose: "本番環境を更新するための稟議書類を作成する。" },
      { id: "o-trouble", name: "トラブル対応", output: "対応方針",
        purpose: "発生した事象を分析し、対応する。",
        steps: [
          { title: "事象の分析", role: "リーダー", kind: "判断",
            judge: { scope: "自分たち", who: "リーダー", basis: "ログ・業務知識" } },
          { title: "移行データ起因かの切り分け", role: "リーダー", kind: "判断",
            judge: { scope: "自分たち", who: "リーダー", basis: "移行の経緯・業務知識" } },
          { title: "対応", role: "作業者", kind: "定型" }
        ] }
    ]
  },
  {
    id: "other", name: "その他（標準化に伴う随時の作業）",
    desc: "広い意味では移行に含まれるが、決まった型に収まりにくい作業。プロパーからのブリーフィングを受けて発生することが多い。",
    tasks: [
      { id: "x-test", name: "テスト実施", output: "テスト結果", purpose: "総合テストなどのテストを実施する。", status: "要確認" },
      { id: "x-limit", name: "制限事項の報告資料作成", output: "制限事項の報告資料", purpose: "標準化に伴う制限事項を資料にまとめる。" },
      { id: "x-adhoc", name: "単発作業", output: "依頼ごとに異なる",
        purpose: "マスタースケジュール外で発生する依頼に対応する。",
        steps: [
          { title: "ブリーフィングの受け取り", role: "リーダー", kind: "調整", detail: "プロパーから依頼・情報共有を受ける。" },
          { title: "内容の整理・起票", role: "リーダー", kind: "定型", detail: "聞いた内容を記録し、タスクボードに起票する。" },
          { title: "割り振り", role: "リーダー", kind: "判断",
            judge: { scope: "自分たち", who: "リーダー", basis: "メンバーのスキル・負荷" } },
          { title: "実施", role: "作業者", kind: "定型" }
        ] }
    ]
  },
  {
    id: "common", name: "共通作業",
    desc: "領域をまたいで出てくる作業。",
    tasks: [
      { id: "c-schedule", name: "日程調整", output: "実施日程", purpose: "実施日程を関係者と調整する。" },
      { id: "c-issues", name: "課題管理", output: "課題一覧", purpose: "課題を抽出し、対応を管理する。" },
      { id: "c-version", name: "版の管理", output: "資産・手順書・環境バージョン一覧", purpose: "資産・手順書・環境バージョン一覧の版を管理する。" }
    ]
  }
];
