import axios from 'axios';

const LOCATIONIQ_BASE_URL = 'https://us1.locationiq.com/v1';

export const geocodeAddress = async (address) => {
    try {
        console.log('🔍 Geocoding address:', address);

        const response = await axios.get(`${LOCATIONIQ_BASE_URL}/search.php`, {
            params: {
                key: process.env.LOCATIONIQ_API_KEY,
                q: address,
                format: 'json',
                limit: 1,
            },
        });

        if (response.data && response.data.length > 0) {
            const result = response.data[0];

            console.log('✅ Geocoding successful');

            return {
                lat: parseFloat(result.lat),
                lng: parseFloat(result.lon),
                formattedAddress: result.display_name,
            };
        } else {
            throw new Error('Address not found');
        }
    } catch (error) {
        console.error('❌ Geocoding error:', error.response?.data || error.message);
        throw new Error('Failed to geocode address');
    }
};

export const autocompleteAddress = async (query) => {
    try {
        const response = await axios.get(`${LOCATIONIQ_BASE_URL}/autocomplete.php`, {
            params: {
                key: process.env.LOCATIONIQ_API_KEY,
                q: query,
                limit: 5,
                format: 'json',
            },
        });

        return response.data.map((item) => ({
            label: item.display_name,
            value: item.display_name,
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
        }));
    } catch (error) {
        console.error('❌ Autocomplete error:', error.message);
        return [];
    }
};
export const findNearbyListings = async (lat, lng, maxDistance = 10000) => {
    try {
        const Listing = (await import('../models/listing.model.js')).default;

        const listings = await Listing.find({
            location: {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [lng, lat], 
                    },
                    $maxDistance: maxDistance, 
                },
            },
        }).limit(50);

        return listings;
    } catch (error) {
        console.error('❌ Find nearby error:', error.message);
        throw error;
    }
};

export const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) ;
    const φ2 = (lat2 * Math.PI) ;
    const Δφ = ((lat2 - lat1) * Math.PI) ;
    const Δλ = ((lon2 - lon1) * Math.PI) ;

    const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
};