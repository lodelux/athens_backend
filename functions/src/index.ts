import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

const { initializeApp } = require('firebase-admin/app');

initializeApp();


function getFoodReward(price: number, foodSales: number, totalSales: number) {
    return (price / 10) * (totalSales / (foodSales + 1))
}

export const buyFood = functions.https.onRequest(async (req, res) => {
    const decodedToken = await admin.auth().verifyIdToken(req.body.user_token);

    const firestoreInstance = admin.firestore();
    const r = await firestoreInstance.runTransaction(async t => {

        try {
            const foodRequest = t.get(firestoreInstance.collection('restaurants/' + req.body.restaurant_id + '/food').doc(req.body.food_id));
            const restaurantRequest = t.get(firestoreInstance.collection('restaurants').doc(req.body.restaurant_id));
            const userRequest = t.get(firestoreInstance.collection('users').doc(decodedToken.uid));

            const food = (await foodRequest).data();
            const restaurant = (await restaurantRequest).data();
            const user = (await userRequest).data();

            const reward = getFoodReward(food['price'], food['sales'], restaurant['total_sales']);

            await Promise.all([
                t.update(firestoreInstance.collection('restaurants/' + req.body.restaurant_id + '/food').doc(req.body.food_id), {
                    sales: food['sales'] + 1,
                    reward: reward
                }),
                t.update(firestoreInstance.collection('restaurants').doc(req.body.restaurant_id), {
                    total_sales: restaurant['total_sales'] + 1
                }),
                t.update(firestoreInstance.collection('users').doc(decodedToken.uid), {
                    points: user['points'] + 1
                })
            ]);

            return 200;
        } catch(e) {
            console.log(e);
            return 400;
        }
    });

    if (r != 200) {
        res.sendStatus(r);
    }

    res.send({"response": "OK"});
});

export const onPointsUpdate = functions.firestore.document('users/{user}').onUpdate(async (change, context) => {
    const points = change.after.data()['points'];

    if (change.before.data()['points'] === change.after.data()['points']) {
        return;
    }

    let newLevel = 0;

    if (points === 100) {
        newLevel = 1;
    }
    else if (points === 200) {
        newLevel = 2;
    }
    else if (points === 300) {
        newLevel = 3;
    }
    else if (points === 400) {
        newLevel = 4;
    }

    if (newLevel > 0) {
        await change.after.ref.update({
            level: newLevel
        });
    }
});

export const getDailyTrivia = functions.https.onRequest(async (req, res) => {
    //return all trivias that are daily
    try {
        const trivia = (await admin.firestore().collection('trivias').where('isDaily', '==', true).get()).docs[0];
        //    return trivia but without isCorrect and comment in answers, and adding doc id to trivia
        const triviaData = trivia.data();


        const result = {
            id: trivia.id,
            question: triviaData.question,
            answers: triviaData.answers.map((answer) => {
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
    const decodedToken = await admin.auth().verifyIdToken(req.body.user_token);
    const firestoreInstance = admin.firestore();

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
        const trivia = await firestoreInstance.collection('trivias').doc(triviaId).get();
        const triviaData = trivia.data();
        if (!trivia.exists) {
            res.status(400).json(`Error: Trivia not found`);
            return;
        }

        if (triviaData.answers[answerIndex].isCorrect) {
            const writeBatch = firestoreInstance.batch();

            let addedPoints = 10 - triviaData['correct_answers'];

            if (addedPoints > 0) {
                writeBatch.update(firestoreInstance.collection('users').doc(decodedToken.uid), {
                    points: FieldValue.increment(addedPoints)
                });
            }

            writeBatch.update(trivia.ref, {
                correct_answers: FieldValue.increment(1)
            });

            writeBatch.commit();
        }

        const correctAnswerIndex = triviaData.answers.findIndex((answer: any) => answer.isCorrect);
        res.json(
            {
                correctAnswerIndex: correctAnswerIndex,
                comment: triviaData.answers[correctAnswerIndex].comment
            }
        );
    } catch (e: any) {
        res.status(400).json(`Error: ${e.message}`);
    }
});



