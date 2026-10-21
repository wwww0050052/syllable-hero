/*
 * 課本單字表 —— 內容來自課本 Get Ready、Unit 1 The Birthday Party、Unit 2 Poor Kevin、Review 1（p.5–22）。
 * 也可以在 App 的「家長設定」裡直接編輯。
 *
 * 單字格式（一行一個）：
 *   拆好的單字 | 中文 | 表情符號 | 例句(可省略)
 *   - 用「-」分開音節（拍手的拍數）：  hap-py  → 2 拍
 *   - 用「+」分開同一拍裡的「聲音積木」（字首音 + 韻尾），對應課本的 _ig、_en 練習：
 *       h+en  → 1 拍，2 塊積木（h · en）
 *   - 都沒標的話，App 會自動猜音節。
 *
 * 句子格式（以 > 開頭）：
 *   > How old are you? | 你幾歲？ | 🎂
 *
 * 以 # 開頭的行是「單元名稱」。
 */
window.DEFAULT_BOOK = `
# Get Ready 字母 Aa–Ee・數字 1–5
ap-ple | 蘋果 | 🍎 | I like apples.
ant | 螞蟻 | 🐜 | I see an ant.
b+ag | 袋子 | 👜 | This is my bag.
c+at | 貓 | 🐱 | I have a cat.
c+ar | 汽車 | 🚗 | It's a car.
d+uck | 鴨子 | 🦆 | The duck is white.
egg | 蛋 | 🥚 | I have an egg.
one | 一 | 1️⃣
two | 二 | 2️⃣
three | 三 | 3️⃣
four | 四 | 4️⃣
five | 五 | 5️⃣
> What's your name? | 你叫什麼名字？ | 🙋
> My name is Amy. | 我的名字是 Amy。 | 👧
> I'm Kevin. | 我是 Kevin。 | 👦

# Unit 1 The Birthday Party 生日派對
s+ix | 六 | 6️⃣ | I'm six years old.
sev-en | 七 | 7️⃣ | I'm seven years old.
eight | 八 | 8️⃣ | I'm eight years old.
n+ine | 九 | 9️⃣ | I'm nine years old.
t+en | 十 | 🔟 | I'm ten years old.
f+an | 電風扇 | 🪭 | The fan is green.
g+oat | 山羊 | 🐐 | I see a goat.
h+at | 帽子 | 👒 | I like my hat.
h+am | 火腿 | 🍖 | I eat ham.
ink | 墨水 | 🖋️
ig-loo | 冰屋 | 🧊
j+am | 果醬 | 🍓 | I like jam.
j+et | 噴射機 | ✈️
> How old are you? | 你幾歲？ | 🎂
> I'm seven years old. | 我七歲。 | 7️⃣
> I'm ten. | 我十歲。 | 🔟

# Unit 2 Poor Kevin 可憐的 Kevin
hap-py | 快樂的 | 😄 | I'm happy.
s+ad | 難過的 | 😢 | I'm sad.
an-gry | 生氣的 | 😠 | Are you angry?
hun-gry | 餓的 | 🤤 | I'm hungry.
thirs-ty | 渴的 | 🥤 | Are you thirsty?
key | 鑰匙 | 🔑
k+id | 小孩 | 🧒
li-on | 獅子 | 🦁 | The lion is big.
l+eg | 腿 | 🦵
m+op | 拖把 | 🧹
n+et | 網子 | 🥅
ox | 公牛 | 🐂
> Are you hungry? | 你餓了嗎？ | 🤤
> Yes, I am. | 是的，我餓了。 | 👍
> No, I'm not. | 不，我沒有。 | 👎
> Are you thirsty? | 你口渴嗎？ | 🥤
> I'm happy. | 我很快樂。 | 😄

# Review 1 複習
b+ed | 床 | 🛏️ | This is my bed.
b+ig | 大的 | 🐘 | The elephant is big.
b+ad | 壞的 | 👎
d+ad | 爸爸 | 👨
h+en | 母雞 | 🐔
> Hello, I'm Amy. | 哈囉，我是 Amy。 | 👋
> I'm ten years old. | 我十歲。 | 🎂
> Hi, my name is Kevin. | 嗨，我的名字是 Kevin。 | 👦
> I'm seven years old. I'm hungry. | 我七歲。我餓了。 | 🌭
`;
