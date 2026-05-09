const express = require('express')
const router = express.Router()
const { getProvinces, getDistricts, getWards } = require('../controllers/locationController')

router.get('/provinces', getProvinces)
router.get('/districts', getDistricts)
router.get('/wards', getWards)

module.exports = router














