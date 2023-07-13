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
        console.log('DEBUG 0');
        try {

            console.log(req.body);

            const foodRequest = t.get(firestoreInstance.collection('restaurants/' + req.body.restaurant_id + '/food').doc(req.body.food_id));
            const restaurantRequest = t.get(firestoreInstance.collection('restaurants').doc(req.body.restaurant_id));

            console.log('DEBUG 1');

            const food = (await foodRequest).data();
            const restaurant = (await restaurantRequest).data();

            console.log('DEBUG 2');
            console.log(food);
            console.log(restaurant);

            const reward = getFoodReward(food['price'], food['sales'], restaurant['total_sales']);

            console.log('DEBUG 3');
            console.log(food);
            console.log(restaurant);

            await Promise.all([
                t.update(firestoreInstance.collection('restaurants/' + req.body.restaurant_id + '/food').doc(req.body.food_id), {
                    sales: food['sales'] + 1,
                    reward: reward
                }),
                t.update(firestoreInstance.collection('restaurants').doc(req.body.restaurant_id), {
                    total_sales: restaurant['total_sales'] + 1
                })]);

            console.log('DEBUG 4');

            return 200;
        } catch(e) {
            console.log(e);
            return 400;
        }
    });

    res.sendStatus(r);
});
