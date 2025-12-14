import Listing from "../models/listing.model.js";
import { errorHandler } from "../utils/error.js";
import {
  geocodeAddress,
  findNearbyListings,
  autocompleteAddress,
  calculateDistance,
} from '../services/geocoding.service.js';

export const createListing = async (req, res, next) => {
  try {
    const { address, ...listingData } = req.body;

    console.log('📝 Creating listing with address:', address);

    const geocoded = await geocodeAddress(address);

    const listing = await Listing.create({
      ...listingData,
      address: geocoded.formattedAddress,
      location: {
        type: 'Point',
        coordinates: [geocoded.lng, geocoded.lat], 
      },
      userRef: req.user.id,
    });

    console.log('✅ Listing created with location:', listing.location.coordinates);

    res.status(201).json({
      success: true,
      message: 'Listing created successfully',
      listing,
    });
  } catch (error) {
    console.error('❌ Create listing error:', error.message);
    next(error);
  }
};

export const searchListings = async (req, res, next) => {
  try {
    const { query, radius = 10000 } = req.query;

    if (!query) {
      return next(errorHandler(400, 'Search query is required'));
    }

    console.log('🔍 Searching for:', query);

    const listingsByName = await Listing.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { address: { $regex: query, $options: 'i' } },
      ],
    }).limit(50);

    if (listingsByName.length > 0) {
      console.log(`✅ Found ${listingsByName.length} listings by name`);

      return res.status(200).json({
        success: true,
        searchType: 'name',
        count: listingsByName.length,
        listings: listingsByName,
      });
    }

    try {
      const geocoded = await geocodeAddress(query);
      const nearbyListings = await findNearbyListings(
        geocoded.lat,
        geocoded.lng,
        parseInt(radius)
      );

      const listingsWithDistance = nearbyListings.map((listing) => {
        const distance = calculateDistance(
          geocoded.lat,
          geocoded.lng,
          listing.location.coordinates[1],
          listing.location.coordinates[0]
        );

        return {
          ...listing.toObject(),
          distance: Math.round(distance),
          distanceKm: (distance / 1000).toFixed(2),
        };
      });

      listingsWithDistance.sort((a, b) => a.distance - b.distance);

      console.log(`✅ Found ${listingsWithDistance.length} nearby listings`);

      return res.status(200).json({
        success: true,
        searchType: 'location',
        location: {
          lat: geocoded.lat,
          lng: geocoded.lng,
          address: geocoded.formattedAddress,
        },
        radius: parseInt(radius),
        count: listingsWithDistance.length,
        listings: listingsWithDistance,
      });
    } catch (geocodeError) {
      return res.status(404).json({
        success: false,
        message: 'No listings found',
      });
    }
  } catch (error) {
    console.error('❌ Search error:', error.message);
    next(error);
  }
};

export const getAddressSuggestions = async (req, res, next) => {
  try {
    const { query } = req.query;

    if (!query || query.length < 3) {
      return res.status(200).json({
        success: true,
        suggestions: [],
      });
    }

    const suggestions = await autocompleteAddress(query);

    res.status(200).json({
      success: true,
      suggestions,
    });
  } catch (error) {
    console.error('❌ Autocomplete error:', error.message);
    next(error);
  }
};
export const deleteListing = async (req, res, next) => {
  const listing = await Listing.findById(req.params.id);

  if (!listing) {
    return next(errorHandler(404, "Listing not found!"));
  }

  if (req.user.id !== listing.userRef) {
    return next(errorHandler(401, "You can only delete your own listings!"));
  }

  try {
    await Listing.findByIdAndDelete(req.params.id);
    res.status(200).json("Listing has been deleted!");
  } catch (error) {
    next(error);
  }
};

export const updateListing = async (req, res, next) => {
  const listing = await Listing.findById(req.params.id);
  if (!listing) {
    return next(errorHandler(404, "Listing not found!"));
  }
  if (req.user.id !== listing.userRef) {
    return next(errorHandler(401, "You can only update your own listings!"));
  }

  try {
    const updatedListing = await Listing.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.status(200).json(updatedListing);
  } catch (error) {
    next(error);
  }
};

export const getListing = async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      return next(errorHandler(404, "Listing not found!"));
    }
    res.status(200).json(listing);
  } catch (error) {
    next(error);
  }
};

export const getListings = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 9;
    const startIndex = parseInt(req.query.startIndex) || 0;
    let offer = req.query.offer;

    if (offer === undefined || offer === "false") {
      offer = { $in: [false, true] };
    }

    let furnished = req.query.furnished;

    if (furnished === undefined || furnished === "false") {
      furnished = { $in: [false, true] };
    }

    let parking = req.query.parking;

    if (parking === undefined || parking === "false") {
      parking = { $in: [false, true] };
    }

    let type = req.query.type;

    if (type === undefined || type === "all") {
      type = { $in: ["sale", "rent"] };
    }

    const searchTerm = req.query.searchTerm || "";

    const sort = req.query.sort || "createdAt";

    const order = req.query.order || "desc";

    const listings = await Listing.find({
      name: { $regex: searchTerm, $options: "i" },
      offer,
      furnished,
      parking,
      type,
    })
      .sort({ [sort]: order })
      .limit(limit)
      .skip(startIndex);

    return res.status(200).json(listings);
  } catch (error) {
    next(error);
  }
};
