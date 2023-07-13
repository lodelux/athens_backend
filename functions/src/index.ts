import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

const { initializeApp } = require('firebase-admin/app');

initializeApp();


function getFoodReward(price: number, foodSales: number, totalSales: number) {
    return (price / 10) * (totalSales / (foodSales + 1))
}

exports.buyFood = functions.https.onRequest(async (req, res) => {
    const firestoreInstance = admin.firestore();
    const r = await firestoreInstance.runTransaction(async t => {
        
        try {
            const foodRequest = t.get(firestoreInstance.collection('restaurants/' + req.body.restaurant_id + '/food').doc(req.body.food_id));
            const restaurantRequest = t.get(firestoreInstance.collection('restaurants').doc(req.body.restaurant_id));

            const food = (await foodRequest).data();
            const restaurant = (await restaurantRequest).data();

            const reward = getFoodReward(food['price'], food['sales'], restaurant['total_sales']);

            await Promise.all([
                t.update(firestoreInstance.collection('restaurants/' + req.body.restaurant_id + '/food').doc(req.body.food_id), {
                    sales: food['sales'] + 1,
                    reward: reward
                }),
                t.update(firestoreInstance.collection('restaurants').doc(req.body.restaurant_id), {
                    total_sales: restaurant['total_sales'] + 1
                })]);

            return 200;
        } catch(e) {
            console.log(e);
            return 400;
        }
    });

    res.send({"response": "OK"});
});


export const getDailyTrivia = functions.https.onRequest(async (req, res) => {
    //return all trivias that are daily
    try {
        const trivia = (await db.trivias.where('isDaily', '==', true).limit(1).get()).docs[0];
        //    return trivia but without isCorrect and comment in answers, and adding doc id to trivia
        const triviaData = trivia.data();

        const result = {
            id: trivia.id,
            question: triviaData.question,
            answers: triviaData.answers.map((answer: Answer) => {
                    return answer.text;
                }
            ),
            topicID: triviaData.topicID
        }
        res.json(result);
    } catch (e: any) {
        res.status(400).json(`Error: ${e.message}`);
    }
}
);

export const submitTriviaAnswer = functions.https.onRequest(async (req, res) => {
//    received data is {triviaId: string, answerIndex: int}

let triviaId: string;
let answerIndex: number;
try {
    triviaId = req.body.triviaId;
    answerIndex = req.body.answerIndex;
} catch (e: any) {
    res.status(400).json(`Error: invalid request`);
    return;
}

try {
    const trivia = (await db.trivias.doc(triviaId).get()).data();
    if (!trivia) {
        res.status(400).json(`Error: Trivia not found`);
        return;
    }

    if (trivia.answers[answerIndex].isCorrect) {
        //    TODO: add points to user
    }

    const correctAnswerIndex = trivia.answers.findIndex((answer: any) => answer.isCorrect);
    res.json(
        {
            correctAnswerIndex: correctAnswerIndex,
            comment: trivia.answers[correctAnswerIndex].comment
        }
    );
} catch (e: any) {
    res.status(400).json(`Error: ${e.message}`);
}
});



