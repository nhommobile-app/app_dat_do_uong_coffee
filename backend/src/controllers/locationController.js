const axios = require('axios')

// Public VN administrative divisions API
const BASE = 'https://provinces.open-api.vn/api'

async function getProvinces(req, res) {
  try {
    const response = await axios.get(`${BASE}/p/`) // provinces list
    const data = Array.isArray(response.data) ? response.data : []
    const provinces = data.map(p => ({ code: String(p.code), name: p.name }))
    res.json(provinces)
  } catch (err) {
    console.error('getProvinces error:', err.message)
    res.status(500).json({ message: 'Không thể tải danh sách Tỉnh/Thành phố' })
  }
}

async function getDistricts(req, res) {
  try {
    const { provinceCode } = req.query
    if (!provinceCode) {
      return res.status(400).json({ message: 'Thiếu provinceCode' })
    }
    const response = await axios.get(`${BASE}/p/${provinceCode}?depth=2`)
    const districts = (response.data?.districts || []).map(d => ({ code: String(d.code), name: d.name }))
    res.json(districts)
  } catch (err) {
    console.error('getDistricts error:', err.message)
    res.status(500).json({ message: 'Không thể tải danh sách Quận/Huyện' })
  }
}

async function getWards(req, res) {
  try {
    const { districtCode } = req.query
    if (!districtCode) {
      return res.status(400).json({ message: 'Thiếu districtCode' })
    }
    const response = await axios.get(`${BASE}/d/${districtCode}?depth=2`)
    const wards = (response.data?.wards || []).map(w => ({ code: String(w.code), name: w.name }))
    res.json(wards)
  } catch (err) {
    console.error('getWards error:', err.message)
    res.status(500).json({ message: 'Không thể tải danh sách Phường/Xã' })
  }
}

module.exports = { getProvinces, getDistricts, getWards }


