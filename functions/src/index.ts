import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

const { initializeApp } = require('firebase-admin/app');

initializeApp();


function getFoodReward(price: number, foodSales: number, totalSales: number) {
    return (price / 10) * (totalSales / (foodSales + 1))
}

export const buyFood = functions.https.onRequest(async (req, res) => {

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

    if (r != 200) {
        res.sendStatus(r);
    }

    res.send({"response": "OK"});
});
