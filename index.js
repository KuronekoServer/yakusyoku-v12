const {
  Client
} = require('discord.js');
const client = new Client({
  partials: ['MESSAGE', 'CHANNEL', 'REACTION']
});
const react = ["1⃣", "2⃣", "3⃣", "4⃣", "5⃣", "6⃣", "7⃣", "8⃣", "9⃣", "🔟"];
//リアクションの配列を作る
const Keyv = require('keyv')
const job = new Keyv('sqlite://db.sqlite', { table: 'job' })
//テーブル作る
client.on("message", async message => {
    //メッセージイベント発火
    if (message.content.startsWith("!役職")) {
        //初めの文字が!役職の場合
        if (!message.member.permissions.has("ADMINISTRATOR")) return message.channel.send('NOADOMIN');
        //権限確認
        const args = message.content.split(" ").slice(1);
        //argsにメッセージの初めの文字を消した奴を代入する
        if (!args[0]) return message.channel.send("ないよ");
        //argsの初めの文字がundefindの場合警告
        if (args.length > react.length) return message.channel.send(`役職数が多すぎます!!\nできる役職の数${react.length}個\nあなたの役職数${args.length}個\n差${args.length - react.length}個`);
        //絵文字の数が指定された役職の数より少なかった場合警告
        const act = await message.channel.send({
            embed: {
                //embedを作る
                description: "処理中"
            }
        })
        let count = 0;
        //countに0を代入する
        await Promise.all(args.map(async roles => {
            //複数のPromise関数を実行し、全ての結果を得る
            await message.member.roles.add(roles.replace(/[^0-9]/g, '')).then(async() => {
                //数字のみ摘出してメッセージを打った人にロールを付ける
                await job.set(String(act.id) + String(count++), roles.replace(/[^0-9]/g, ''))
                //jobにメッセージID+countのkeyでロールIDをsetする
            })
        })).then(() => {
            act.edit({
                //actを編集
                embed: {
                    //embedを作る
                    description: args.map((cntent, ji) => `${react[ji]} ${message.guild.roles.cache.find(role => role.id === cntent.replace(/[^0-9]/g, ''))}`).join("\n")
                    //guildにあるロールをすべて取得して対象のロールのみ摘出する
                }
            })
            react.slice(0, args.length).forEach((emoji) => act.react(emoji))
            //リアクションを0～役職の数だけさっき代入したactにリアクションを付ける
        }).catch(e => act.edit({
            //actを編集
            embed: {
                //embedを作る
                description: `エラー:${e.message}`
                //エラーを出す
            }
        }))
    }
})
client.on('messageReactionAdd', async(reaction, user) => {
    //リアクションされたときにイベント発火
    if (user.bot) return;
    //リアクションしたのがBOTの場合処理停止
    const users = reaction.message.guild.members.resolve(user)
    //usersにリアクションしたユーザーの情報を代入する
    const check = await job.get(String(reaction.message.id) + "0")
    //jobにIDが登録されてるか確認(true:false)
    if (!check) return;
    //checkがfalseだったら処理停止
    reaction.users.remove(user)
    //リアクションを付けられないように
    if (react.includes(reaction.emoji.name)) {
        //リアクションが入っているか
        const num = react.join("").split(reaction.emoji.name)[0].length / 2
        //押されたreactionの数字を検知
        const roleid = await job.get(String(reaction.message.id) + String(num))
        //jobからロールID取得
        if (!roleid) return;
        //代入された値がなかったら処理停止
        if (users.roles.cache.has(roleid)) {
            //ユーザーにロールがついていたら
            users.roles.remove(roleid)
                //ロールを消す
                .then(() =>
                    //成功したら
                    reaction.message.channel.send(`${users} 消したよ！`)
                    //送信
                    .then(m => m.delete({
                        timeout: 5000
                    }))
                    //message消す
                ).catch(e => reaction.message.channel.send(`エラー:${e.message}`))
            //失敗したらエラーmessage
        } else {
            //ロールがついていなかったら
            users.roles.add(roleid)
                //ロールを付ける以下ほぼ同じ
                .then(() => reaction.message.channel.send(`${users}つけたよ！`).then(m => m.delete({
                    timeout: 5000
                }))).catch(e => reaction.message.channel.send(`エラー:${e.message}`))
        }
    }
});
client.login("YOUTOKEN");
//clientをloginさせる
