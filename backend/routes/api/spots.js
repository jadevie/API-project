const express = require('express');
const { Op, sequelize, Sequelize } = require('sequelize');
const { setTokenCookie, requireAuth, requireProperAuthorization } = require('../../utils/auth');
const { Spot, SpotImage, Review, User } = require('../../db/models');
const { check } = require('express-validator');
const { handleValidationErrors } = require('../../utils/validation');
const router = express.Router();

// Add an Image to a Spot based on the Spot's id
router.post('/:spotId/images', requireAuth, requireProperAuthorization, async (req, res, next) => {
    const spotId = req.params.spotId;
    const { url, preview } = req.body;

    const newImage = await SpotImage.create({
        spotId, url, preview
    });
    const data = await SpotImage.scope('defaultScope').findByPk(newImage.id);
    res.json(data);

});

// Create a Spot
const validateRequest = [
    check('address')
        .exists({ checkFalsy: true })
        .withMessage("Street address is required"),
    check('city')
        .exists({ checkFalsy: true })
        .withMessage("City is required"),
    check('state')
        .exists({ checkFalsy: true })
        .withMessage("State is required"),
    check('country')
        .exists({ checkFalsy: true })
        .withMessage("Country is required"),
    check('lat')
        .exists({ checkFalsy: true })
        .withMessage("Latitude is not valid"),
    check('lng')
        .exists({ checkFalsy: true })
        .withMessage("Longitude is not valid"),
    check('name')
        .exists({ checkFalsy: true })
        .withMessage("Name must be less than 50 characters"),
    check('description')
        .exists({ checkFalsy: true })
        .withMessage("Description is required"),
    check('price')
        .exists({ checkFalsy: true })
        .withMessage("Price per day is required"),
    handleValidationErrors
];
router.post('/', requireAuth, validateRequest, async (req, res, next) => {
    try {
        const ownerId = req.user.id;
        const { address, city, state, country, lat, lng, name, description, price } = req.body;

        const newSpot = await Spot.create({
            ownerId, address, city, state, country, lat, lng, name, description, price
        });
        res.json(newSpot);
    } catch (e) {
        console.log(e.message);
    }
});

// Get all Spots owned by the Current User
router.get('/current', requireAuth, async (req, res, next) => {
    try {
        const id = req.user.id;
        const spots = await Spot.findByPk(id, {
            include: [
                {
                    model: Review,
                    attributes: []
                },
                {
                    model: SpotImage,
                    attributes: []
                }
            ],
            attributes: {
                include: [
                    [Sequelize.fn('AVG', Sequelize.col('Reviews.stars')), 'avgRating'], [Sequelize.col('SpotImages.url'), 'previewImage']]
            }
        });
        res.json({ "Spots": spots });
    }
    catch (e) {
        console.log(e.message);
    }
});

// Get details of a Spot from an id
router.get('/:spotId', async (req, res, next) => {
    const id = req.params.spotId;
    const spot = await Spot.findByPk(id, {
        include: [
            {
                model: Review,
                attributes: []
            },
            {
                model: SpotImage,
                attributes: ['id', 'url', 'preview']
            },
            {
                model: User,
                as: 'Owner',
                attributes: ['id', 'firstName', 'lastName']
            }
        ],
        attributes: {
            include: [
                [Sequelize.fn('AVG', Sequelize.col('Reviews.stars')), 'avgStarRating']]
        }
    });

    if (!spot.id) {
        res.status(404).json({
            "message": "Spot couldn't be found",
            "statusCode": 404
        });
    }
    res.json(spot);
});


// Get all Spots
router.get('/', async (req, res, next) => {
    const spots = await Spot.findAll({
        include: [
            {
                model: Review,
                attributes: []
            },
            {
                model: SpotImage,
                attributes: []
            }
        ],
        attributes: {
            include: [
                [Sequelize.fn('AVG', Sequelize.col('Reviews.stars')), 'avgRating'], [Sequelize.col('SpotImages.url'), 'previewImage']]
        }
    });
    res.json({ "Spots": spots });
});


module.exports = router;
