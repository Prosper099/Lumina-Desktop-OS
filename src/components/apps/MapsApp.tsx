import React, { useState, useEffect, useRef } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import * as Icons from 'lucide-react';

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';

const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

// Default map center (San Francisco, CA)
const DEFAULT_CENTER = { lat: 37.7749, lng: -122.4194 };

// Categories with nice search queries and icons
const CATEGORIES = [
  { label: 'Cafeterias', query: 'coffee shops in San Francisco', icon: 'Coffee', color: '#f59e0b' },
  { label: 'Restaurants', query: 'highly rated restaurants in San Francisco', icon: 'Utensils', color: '#ef4444' },
  { label: 'Landmarks', query: 'sights and landmarks in San Francisco', icon: 'Compass', color: '#3b82f6' },
  { label: 'Parks', query: 'nature parks in San Francisco', icon: 'Trees', color: '#10b981' },
  { label: 'Hotels', query: 'great hotels in San Francisco', icon: 'Hotel', color: '#8b5cf6' },
];

const PRESET_LANDMARKS = [
  {
    id: 'gg_bridge',
    name: 'Golden Gate Bridge',
    query: 'Golden Gate Bridge, San Francisco, CA',
    description: 'One of the most internationally recognized symbols of San Francisco, California, and the United States. Spanning the Golden Gate strait, this engineering marvel opened in 1937.',
    rating: 4.9,
    reviews: '56,231 reviews',
    image: 'https://images.unsplash.com/photo-1506012787146-f92b2d7d6d96?auto=format&fit=crop&w=600&q=80',
    type: 'Bridge / Landmark',
  },
  {
    id: 'alcatraz',
    name: 'Alcatraz Island',
    query: 'Alcatraz Island, San Francisco, CA',
    description: 'Located in San Francisco Bay, Alcatraz once housed some of America\'s most notorious federal criminals, including Al Capone. Today, it is a historic national park.',
    rating: 4.7,
    reviews: '28,945 reviews',
    image: 'https://images.unsplash.com/photo-1548100569-807c40683a45?auto=format&fit=crop&w=600&q=80',
    type: 'Historic Island',
  },
  {
    id: 'f_wharf',
    name: 'Fisherman\'s Wharf',
    query: 'Fisherman\'s Wharf, San Francisco, CA',
    description: 'A historic waterfront neighborhood known for its fresh seafood, clam chowder sourdough bowls, bustling souvenir stands, and the playful sea lions at Pier 39.',
    rating: 4.5,
    reviews: '41,102 reviews',
    image: 'https://images.unsplash.com/photo-1624314138470-5a2f24623f10?auto=format&fit=crop&w=600&q=80',
    type: 'Waterfront / Dining',
  },
  {
    id: 'lombard',
    name: 'Lombard Street',
    query: 'Lombard Street, San Francisco, CA',
    description: 'Famous for being the "crookedest street in the world," Lombard Street features eight sharp, hairpin turns down a steep one-block hill, lined with beautiful flowers.',
    rating: 4.6,
    reviews: '19,322 reviews',
    image: 'https://images.unsplash.com/photo-1505245208761-ba872912fac0?auto=format&fit=crop&w=600&q=80',
    type: 'Scenic Street',
  },
  {
    id: 'coit_tower',
    name: 'Coit Tower',
    query: 'Coit Tower, San Francisco, CA',
    description: 'An elegant 210-foot art deco tower perched atop Telegraph Hill. It offers panoramic 360-degree views of the city and features beautiful murals inside.',
    rating: 4.5,
    reviews: '12,544 reviews',
    image: 'https://images.unsplash.com/photo-1601134991666-d9dbca83ac4a?auto=format&fit=crop&w=600&q=80',
    type: 'Observation Tower',
  }
];

export const MapsApp: React.FC = () => {
  // If NO valid Google Maps Platform Key is configured, show our awesome, fully working Standard Mode.
  if (!hasValidKey) {
    return <StandardMapContainer />;
  }

  return (
    <APIProvider apiKey={API_KEY} version="weekly">
      <MapContainer />
    </APIProvider>
  );
};

// ==========================================
// STANDARD MAP CONTAINER (No API Key Required)
// ==========================================
const StandardMapContainer: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeLocation, setActiveLocation] = useState('San Francisco, CA');
  const [mapType, setMapType] = useState<'roadmap' | 'satellite' | 'terrain'>('roadmap');
  const [zoom, setZoom] = useState<number>(14);
  const [selectedLandmark, setSelectedLandmark] = useState<typeof PRESET_LANDMARKS[number] | null>(PRESET_LANDMARKS[0]);
  const [showKeyInfo, setShowKeyInfo] = useState(false);

  const [starredIds, setStarredIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('lumina_starred_places');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('lumina_starred_places', JSON.stringify(starredIds));
  }, [starredIds]);

  const toggleStar = (id: string) => {
    setStarredIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSearch = (customQuery?: string) => {
    const q = customQuery ?? searchQuery;
    if (!q.trim()) return;
    setActiveLocation(q);
    setSelectedLandmark(null);
  };

  const selectLandmark = (landmark: typeof PRESET_LANDMARKS[number]) => {
    setSelectedLandmark(landmark);
    setActiveLocation(landmark.query);
    setZoom(15);
  };

  return (
    <div className="w-full h-full flex flex-col font-sans select-none overflow-hidden bg-slate-950 text-slate-100" id="lumina_maps_root">
      {/* Search Header panel */}
      <div className="px-4 py-2.5 bg-[#090d16] border-b border-white/5 flex items-center justify-between flex-wrap gap-3 z-10">
        <div className="flex items-center gap-2">
          <Icons.Compass className="w-5 h-5 text-amber-500 animate-spin-slow" />
          <span className="font-bold text-sm text-slate-200">Lumina Maps</span>
          <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-mono uppercase tracking-wider">
            Standard Mode
          </span>
        </div>

        {/* Categories Scroller Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-[400px] py-1 no-scrollbar-x select-none">
          {CATEGORIES.map(cat => {
            const CatIcon = (Icons as any)[cat.icon] || Icons.MapPin;
            return (
              <button
                key={cat.label}
                onClick={() => {
                  setSearchQuery(cat.label + ' in San Francisco');
                  handleSearch(cat.label + ' in San Francisco');
                }}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full border bg-black/30 border-white/5 text-slate-400 hover:border-amber-500/35 hover:text-white transition duration-150 cursor-pointer"
              >
                <CatIcon className="w-3.5 h-3.5" style={{ color: cat.color }} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Main interactive Place search box */}
        <div className="flex items-center gap-1.5 max-w-sm w-full relative">
          <Icons.Search className="w-4 h-4 text-slate-400 absolute left-3" />
          <input
            type="text"
            placeholder="Search address, state, or worldwide sights..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full text-xs bg-slate-900 border border-white/10 rounded-lg pl-9 pr-24 py-2 text-slate-200 focus:outline-none focus:border-amber-500 transition-colors"
          />
          <button
            onClick={() => handleSearch()}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-500 text-[10px] font-semibold text-slate-950 cursor-pointer transition-colors"
          >
            Find
          </button>
        </div>
      </div>

      {/* Main Map workspace + detail sidebar */}
      <div className="flex-1 flex overflow-hidden min-h-0 relative">
        {/* Left Side: Map UI Embed */}
        <div className="flex-1 h-full relative overflow-hidden bg-slate-900">
          <iframe
            src={`https://maps.google.com/maps?q=${encodeURIComponent(activeLocation)}&t=${mapType === 'roadmap' ? 'm' : mapType === 'satellite' ? 'k' : 'p'}&z=${zoom}&output=embed`}
            className="w-full h-full border-0"
            allowFullScreen
            loading="lazy"
            title="Google Map Embed"
          />

          {/* Quick Info Overlay HUD inside the map - Bottom Left */}
          <div className="absolute bottom-3 left-3 bg-slate-950/90 border border-white/10 p-2.5 rounded-lg shadow-xl backdrop-blur-md text-[11px] font-mono text-slate-300 space-y-2 z-10 w-44">
            <div className="text-slate-400 border-b border-white/5 pb-1 flex items-center justify-between">
              <span>MAP CONTROL</span>
              <Icons.Layers className="w-3.5 h-3.5" />
            </div>
            
            {/* Map styling toggle */}
            <div className="grid grid-cols-2 gap-1 text-[10px]">
              {(['roadmap', 'satellite', 'terrain'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setMapType(type)}
                  className={`px-1.5 py-0.5 rounded text-center border cursor-pointer capitalize font-semibold transition ${
                    mapType === type 
                      ? 'bg-amber-500/10 border-amber-500 text-amber-400' 
                      : 'bg-black/35 border-white/5 text-slate-400 hover:border-white/10'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            {/* Zoom Adjusters */}
            <div className="flex items-center justify-between gap-1.5 border-t border-white/5 pt-2">
              <span className="text-[10px] text-slate-400">Zoom: {zoom}x</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setZoom(prev => Math.max(1, prev - 1))}
                  className="w-5 h-5 bg-black/40 hover:bg-black/70 border border-white/10 rounded flex items-center justify-center font-bold text-xs cursor-pointer transition-all"
                >
                  -
                </button>
                <button
                  onClick={() => setZoom(prev => Math.min(21, prev + 1))}
                  className="w-5 h-5 bg-black/40 hover:bg-black/70 border border-white/10 rounded flex items-center justify-center font-bold text-xs cursor-pointer transition-all"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Navigation, Curated Landmarks, and Key Instructions */}
        <div className="w-[310px] border-l border-white/5 bg-[#070b12] flex flex-col h-full min-h-0 z-10 relative">
          
          {/* Top of Sidebar: Header details */}
          <div className="p-3.5 border-b border-white/5 bg-slate-950/20">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider font-mono text-amber-400 font-bold">MAP CONSOLE</span>
              <button
                onClick={() => setShowKeyInfo(!showKeyInfo)}
                className="text-[10px] text-emerald-400 hover:underline flex items-center gap-1 font-mono uppercase tracking-wider"
              >
                <Icons.Sparkles className="w-3 h-3" />
                Dev Mode
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
              Google Maps Interactive Feed. Explore coordinates or choose high-fidelity SF bookmarks below.
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
            
            {/* API Key prompt expand block */}
            {showKeyInfo && (
              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-3 space-y-2.5 relative">
                <button 
                  onClick={() => setShowKeyInfo(false)}
                  className="absolute right-2 top-2 text-slate-500 hover:text-white font-mono text-[10px]"
                >
                  ✕
                </button>
                <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <Icons.Key className="w-3.5 h-3.5" />
                  ENABLE DEVELOPER MODE
                </div>
                <p className="text-[10px] text-slate-300 leading-relaxed">
                  Lumina Maps contains full support for the Google Maps JS SDK, Place Search APIs, photo streams, ratings, and live driving routes. To unlock this:
                </p>
                <div className="text-[9px] font-mono text-slate-400 space-y-1 bg-black/40 p-2 rounded border border-white/5">
                  <div>1. Get a key from the Google Cloud Console.</div>
                  <div>2. Open Settings (⚙️ in the main taskbar).</div>
                  <div>3. Go to Secrets & create:</div>
                  <div className="text-emerald-400 font-bold">GOOGLE_MAPS_PLATFORM_KEY</div>
                </div>
              </div>
            )}

            {/* Landmark Spotlight detail card */}
            {selectedLandmark ? (
              <div className="bg-slate-900/60 border border-white/5 rounded-lg p-3 space-y-3.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/20 text-amber-400 font-mono tracking-wider uppercase">
                      Spotlight
                    </span>
                    <h3 className="text-sm font-bold text-white mt-1.5 leading-tight">{selectedLandmark.name}</h3>
                  </div>
                  
                  {/* Bookmark Toggle */}
                  <button
                    onClick={() => toggleStar(selectedLandmark.id)}
                    className="p-1.5 rounded-md hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <Icons.Star
                      className={`w-4 h-4 ${
                        starredIds.includes(selectedLandmark.id)
                          ? 'fill-amber-500 text-amber-500'
                          : 'text-slate-400 hover:text-amber-400'
                      }`}
                    />
                  </button>
                </div>

                {/* Photo */}
                <div className="h-28 w-full rounded overflow-hidden relative border border-white/5">
                  <img
                    src={selectedLandmark.image}
                    alt={selectedLandmark.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                </div>

                {/* Description info */}
                <div className="space-y-1">
                  <span className="text-[9px] text-slate-500 uppercase tracking-widest font-mono">Landmark Description</span>
                  <p className="text-xs text-slate-300 leading-relaxed bg-black/35 border border-white/5 p-2 rounded">
                    {selectedLandmark.description}
                  </p>
                </div>

                {/* Place Types / Rating details */}
                <div className="flex items-center justify-between text-xs font-mono text-slate-400 py-0.5 border-t border-b border-white/5">
                  <span className="truncate max-w-[150px]">{selectedLandmark.type}</span>
                  <div className="flex items-center gap-0.5 text-amber-400">
                    <Icons.Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    <span>{selectedLandmark.rating}</span>
                  </div>
                </div>

                {/* Action trigger */}
                <div className="flex gap-1.5 pt-0.5">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedLandmark.name)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-1.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs rounded flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Icons.ExternalLink className="w-3.5 h-3.5" />
                    Open full Google Maps
                  </a>
                </div>
              </div>
            ) : (
              <div className="bg-slate-900/40 border border-white/5 rounded-lg p-3 space-y-2">
                <div className="text-xs font-bold text-slate-300 flex items-center gap-2">
                  <Icons.MapPin className="w-4 h-4 text-emerald-400" />
                  Custom Map Query Active
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed bg-black/20 p-2.5 rounded">
                  Viewing live coordinates feed for: <strong className="text-white">"{activeLocation}"</strong>. Type a new address or select one of our premium preset sights below.
                </p>
              </div>
            )}

            {/* Curated Bookmark / Places List */}
            <div className="space-y-2.5 pt-2 border-t border-white/5">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono block">Premium Sights & Landmarks</span>
              <div className="space-y-1.5">
                {PRESET_LANDMARKS.map(landmark => {
                  const isCurrent = selectedLandmark?.id === landmark.id;
                  const isStarred = starredIds.includes(landmark.id);
                  return (
                    <div
                      key={landmark.id}
                      onClick={() => selectLandmark(landmark)}
                      className={`p-2.5 rounded-lg text-left border transition duration-150 cursor-pointer flex items-center justify-between gap-3 ${
                        isCurrent 
                          ? 'bg-amber-600/10 border-amber-500/40 text-white shadow-lg shadow-amber-500/5' 
                          : 'bg-black/30 border-white/5 text-slate-400 hover:bg-slate-900 hover:border-white/10'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-[11px] truncate flex items-center gap-1 text-slate-200">
                          {isStarred && <Icons.Star className="w-3 h-3 fill-amber-500 text-amber-500 shrink-0" />}
                          <span>{landmark.name}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 truncate mt-0.5">{landmark.type}</div>
                      </div>
                      <Icons.ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};


// ==========================================
// DEVELOPER MAP CONTAINER (Uses Google Maps SDK)
// ==========================================
const MapContainer: React.FC = () => {
  const map = useMap();
  const placesLib = useMapsLibrary('places');
  const routesLib = useMapsLibrary('routes');

  const [searchQuery, setSearchQuery] = useState('');
  const [places, setPlaces] = useState<google.maps.places.Place[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<google.maps.places.Place | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  
  // Directions state
  const [destinationPlace, setDestinationPlace] = useState<google.maps.places.Place | null>(null);
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);
  const [routingMode, setRoutingMode] = useState<google.maps.TravelMode | 'DRIVING' | 'WALKING' | 'TRANSIT'>('DRIVING');
  const [currentMapType, setCurrentMapType] = useState<'roadmap' | 'satellite' | 'hybrid' | 'terrain'>('roadmap');

  const polylinesRef = useRef<google.maps.Polyline[]>([]);

  // Bookmarks saved in local storage
  const [starredIds, setStarredIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('lumina_starred_places');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('lumina_starred_places', JSON.stringify(starredIds));
  }, [starredIds]);

  const toggleStar = (placeId: string) => {
    setStarredIds(prev =>
      prev.includes(placeId) ? prev.filter(id => id !== placeId) : [...prev, placeId]
    );
  };

  // Perform a Google Maps Text Search (New)
  const handleSearch = async (queryToUse?: string) => {
    const q = queryToUse ?? searchQuery;
    if (!placesLib || !q.trim()) return;

    try {
      const { places: resultPlaces } = await placesLib.Place.searchByText({
        textQuery: q,
        fields: ['displayName', 'location', 'formattedAddress', 'rating', 'id', 'types', 'photos'],
        locationBias: map?.getCenter() || DEFAULT_CENTER,
        maxResultCount: 15,
      });

      setPlaces(resultPlaces || []);
      setDestinationPlace(null);
      setRouteInfo(null);
      // Clear polylines
      polylinesRef.current.forEach(p => p.setMap(null));
      polylinesRef.current = [];

      if (resultPlaces && resultPlaces.length > 0) {
        // Fit Map to the bounds of found places
        if (map) {
          const bounds = new google.maps.LatLngBounds();
          resultPlaces.forEach(p => {
            if (p.location) bounds.extend(p.location);
          });
          map.fitBounds(bounds);
        }
        setSelectedPlace(resultPlaces[0]);
      } else {
        setSelectedPlace(null);
      }
    } catch (err) {
      console.error('Error searching places via Google Maps API:', err);
    }
  };

  // Perform category quick search
  const handleCategoryClick = (cat: typeof CATEGORIES[number]) => {
    if (activeCategory === cat.label) {
      setActiveCategory(null);
      setPlaces([]);
      setSelectedPlace(null);
    } else {
      setActiveCategory(cat.label);
      setSearchQuery('');
      handleSearch(cat.query);
    }
  };

  // Compute directions route
  const calculateRoute = async (destination: google.maps.places.Place) => {
    if (!routesLib || !map || !destination.location) return;

    // Default origin is the starting default viewport center or current view center
    const origin = DEFAULT_CENTER;

    try {
      // Clear previous polylines
      polylinesRef.current.forEach(p => p.setMap(null));
      polylinesRef.current = [];

      const { routes } = await routesLib.Route.computeRoutes({
        origin: { location: origin },
        destination: { location: { lat: destination.location.lat(), lng: destination.location.lng() } },
        travelMode: routingMode as google.maps.TravelMode,
        fields: ['path', 'distanceMeters', 'durationMillis', 'viewport'],
      });

      if (routes && routes[0]) {
        const primaryRoute = routes[0];
        const drawnPolylines = primaryRoute.createPolylines();
        drawnPolylines.forEach(p => {
          // Customize polyline style for dynamic HUD feel
          p.setOptions({
            strokeColor: '#f59e0b',
            strokeOpacity: 0.85,
            strokeWeight: 4,
          });
          p.setMap(map);
        });
        polylinesRef.current = drawnPolylines;

        const distanceKm = ((primaryRoute.distanceMeters || 0) / 1000).toFixed(1);
        
        // Parse durationMillis to string
        const durationMin = Math.round((Number(primaryRoute.durationMillis || 0) / 1000) / 60);
        const durationText = durationMin > 60 
          ? `${Math.floor(durationMin / 60)}h ${durationMin % 60}m` 
          : `${durationMin} mins`;

        setRouteInfo({
          distance: `${distanceKm} km`,
          duration: durationText,
        });

        setDestinationPlace(destination);

        if (primaryRoute.viewport) {
          map.fitBounds(primaryRoute.viewport);
        }
      }
    } catch (err) {
      console.error('Error computing route:', err);
    }
  };

  // Run on map load first search
  useEffect(() => {
    if (placesLib && map) {
      handleSearch('scenic points in San Francisco');
    }
  }, [placesLib]);

  // Recalculate route if mode changes while showing directions
  useEffect(() => {
    if (destinationPlace) {
      calculateRoute(destinationPlace);
    }
  }, [routingMode]);

  // Clean raw component unmount
  useEffect(() => {
    return () => {
      polylinesRef.current.forEach(p => p.setMap(null));
    };
  }, []);

  return (
    <div className="w-full h-full flex flex-col font-sans select-none overflow-hidden bg-slate-950 text-slate-100" id="lumina_maps_root">
      {/* Search Header panel */}
      <div className="px-4 py-2.5 bg-[#090d16] border-b border-white/5 flex items-center justify-between flex-wrap gap-3 z-10">
        <div className="flex items-center gap-2">
          <Icons.Compass className="w-5 h-5 text-amber-500 animate-spin-slow" />
          <span className="font-bold text-sm text-slate-200">Lumina Maps Explorer</span>
          <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded font-mono">GMP SDK v3</span>
        </div>

        {/* Categories Scroller Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-[400px] py-1 no-scrollbar-x select-none">
          {CATEGORIES.map(cat => {
            const isActive = activeCategory === cat.label;
            const CatIcon = (Icons as any)[cat.icon] || Icons.MapPin;
            return (
              <button
                key={cat.label}
                onClick={() => handleCategoryClick(cat)}
                style={{ borderColor: isActive ? cat.color : undefined }}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full border transition duration-150 cursor-pointer ${
                  isActive 
                    ? 'bg-slate-900 border-2 font-semibold text-white' 
                    : 'bg-black/30 border-white/5 text-slate-400 hover:border-white/15'
                }`}
              >
                <CatIcon className="w-3.5 h-3.5" style={{ color: cat.color }} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Main interactive Place search box */}
        <div className="flex items-center gap-1.5 max-w-sm w-full relative">
          <Icons.Search className="w-4 h-4 text-slate-400 absolute left-3" />
          <input
            type="text"
            placeholder="Search address, state, or coordinates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full text-xs bg-slate-900 border border-white/10 rounded-lg pl-9 pr-24 py-2 text-slate-200 focus:outline-none focus:border-amber-500 transition-colors"
          />
          <button
            onClick={() => handleSearch()}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-500 text-[10px] font-semibold text-slate-950 cursor-pointer transition-colors"
          >
            Find
          </button>
        </div>
      </div>

      {/* Main Map workspace + detail sidebar */}
      <div className="flex-1 flex overflow-hidden min-h-0 relative">
        {/* Left Side: Map UI */}
        <div className="flex-1 h-full relative overflow-hidden bg-slate-900">
          <Map
            defaultCenter={DEFAULT_CENTER}
            defaultZoom={13}
            mapTypeId={currentMapType}
            mapId="DEMO_MAP_ID"
            gestureHandling="greedy"
            internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
            style={{ width: '100%', height: '100%' }}
          >
            {/* User starting Point Pointer wrapper */}
            <AdvancedMarker position={DEFAULT_CENTER} title="Default Start (SF Downtown)">
              <Pin background="#00f3ff" glyphColor="#020617" scale={1.1}>
                <div className="w-1.5 h-1.5 rounded-full bg-[#020617]" />
              </Pin>
            </AdvancedMarker>

            {/* Places Markers */}
            {places.map(p => {
              if (!p.location) return null;
              const isSelected = selectedPlace?.id === p.id;
              const isStarred = starredIds.includes(p.id);

              return (
                <AdvancedMarker
                  key={p.id}
                  position={{ lat: p.location.lat(), lng: p.location.lng() }}
                  title={p.displayName || ''}
                  onClick={() => {
                    setSelectedPlace(p);
                    setDestinationPlace(null);
                    setRouteInfo(null);
                    polylinesRef.current.forEach(polyline => polyline.setMap(null));
                    polylinesRef.current = [];
                  }}
                >
                  <Pin
                    background={isSelected ? '#ef4444' : isStarred ? '#eab308' : '#3b82f6'}
                    borderColor={isSelected ? '#fecaca' : isStarred ? '#fef08a' : '#bfdbfe'}
                    glyphColor="#fff"
                    scale={isSelected ? 1.2 : 0.9}
                  />
                </AdvancedMarker>
              );
            })}

            {/* Simple selected marker Info window tooltip */}
            {selectedPlace && selectedPlace.location && (
              <InfoWindow
                position={{ lat: selectedPlace.location.lat(), lng: selectedPlace.location.lng() }}
                onCloseClick={() => setSelectedPlace(null)}
              >
                <div className="text-slate-900 text-xs p-1 min-w-[150px] space-y-1">
                  <div className="font-bold flex items-center gap-1">
                    {starredIds.includes(selectedPlace.id) && <Icons.Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500 inline" />}
                    <span>{selectedPlace.displayName}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 max-w-xs">{selectedPlace.formattedAddress}</p>
                  {selectedPlace.rating && (
                    <div className="flex items-center gap-1 text-[11px] font-medium text-amber-600 mt-0.5">
                      <Icons.Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                      <span>{selectedPlace.rating} rating</span>
                    </div>
                  )}
                  <div className="pt-1 border-t border-slate-200 mt-1 flex items-center justify-between">
                    <button
                      onClick={() => calculateRoute(selectedPlace)}
                      className="px-2 py-0.5 rounded bg-blue-600 text-white font-semibold text-[10px] hover:bg-blue-500 transition-colors"
                    >
                      Router Link
                    </button>
                    <span className="text-[8px] font-mono text-slate-400">ID: {selectedPlace.id.slice(0, 5)}</span>
                  </div>
                </div>
              </InfoWindow>
            )}
          </Map>

          {/* Quick Info Overlay HUD inside the map - Bottom Left */}
          <div className="absolute bottom-3 left-3 bg-slate-950/90 border border-white/10 p-2.5 rounded-lg shadow-xl backdrop-blur-md text-[11px] font-mono text-slate-300 space-y-1.5 z-10 w-44">
            <div className="text-slate-400 border-b border-white/5 pb-1 flex items-center justify-between">
              <span>MAP CONTROL</span>
              <Icons.Layers className="w-3.5 h-3.5" />
            </div>
            
            {/* Map styling toggle */}
            <div className="grid grid-cols-2 gap-1 text-[10px]">
              {(['roadmap', 'satellite', 'hybrid', 'terrain'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setCurrentMapType(type)}
                  className={`px-1.5 py-0.5 rounded text-center border cursor-pointer capitalize font-semibold transition ${
                    currentMapType === type 
                      ? 'bg-amber-500/10 border-amber-500 text-amber-400' 
                      : 'bg-black/35 border-white/5 text-slate-400 hover:border-white/10'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            <div className="text-[10px] text-slate-500 pt-1 border-t border-white/5">
              Ref Centered: <span className="text-slate-300">SF Core</span>
            </div>
          </div>
        </div>

        {/* Right Side: Map Navigation, Search details & directions sidebar */}
        <div className="w-[310px] border-l border-white/5 bg-[#070b12] flex flex-col h-full min-h-0 z-10 relative">
          
          {/* Top of Sidebar: Header details or route summary */}
          <div className="p-3.5 border-b border-white/5 bg-slate-950/20">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider font-mono text-amber-400 font-bold">PLACE CONSOLE</span>
              <span className="text-[10px] text-slate-500 font-mono">Found: ({places.length})</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
              Real-time Google Maps feed centered on San Francisco. Click pins to see metadata summaries.
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
            {/* If a route is computed */}
            {routeInfo && destinationPlace && (
              <div className="bg-amber-500/5 border border-amber-500/25 rounded-lg p-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">ROUTE INFORMATION</span>
                  <button 
                    onClick={() => {
                      setRouteInfo(null);
                      setDestinationPlace(null);
                      polylinesRef.current.forEach(p => p.setMap(null));
                      polylinesRef.current = [];
                    }}
                    className="text-slate-500 hover:text-white font-mono text-xs"
                  >
                    Clear
                  </button>
                </div>
                
                <div className="space-y-1">
                  <div className="text-xs text-slate-400">Destination:</div>
                  <div className="text-sm font-semibold text-slate-200">{destinationPlace.displayName}</div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-center bg-black/40 rounded p-2">
                  <div>
                    <span className="text-[9px] text-slate-500 block font-mono">EST. DISTANCE</span>
                    <span className="text-sm font-bold text-slate-200">{routeInfo.distance}</span>
                  </div>
                  <div className="border-l border-white/5">
                    <span className="text-[9px] text-slate-500 block font-mono">TRAVEL TIME</span>
                    <span className="text-sm font-bold text-amber-400">{routeInfo.duration}</span>
                  </div>
                </div>

                {/* Routing Travel mode picker */}
                <div className="space-y-1">
                  <span className="text-[9px] text-slate-500 font-mono">TRAVEL MODE</span>
                  <div className="flex bg-slate-900 border border-white/5 rounded p-0.5 gap-1">
                    {[
                      { mode: 'DRIVING', icon: 'Car' },
                      { mode: 'WALKING', icon: 'Footprints' },
                      { mode: 'TRANSIT', icon: 'Train' },
                    ].map(item => {
                      const isActive = routingMode === item.mode;
                      const ModeIcon = (Icons as any)[item.icon] || Icons.Compass;
                      return (
                        <button
                          key={item.mode}
                          onClick={() => setRoutingMode(item.mode as any)}
                          className={`flex-1 py-1 rounded text-[10px] font-semibold flex items-center justify-center gap-1 transition cursor-pointer ${
                            isActive 
                              ? 'bg-amber-600 text-slate-950 shadow' 
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <ModeIcon className="w-3.5 h-3.5" />
                          <span>{item.mode.toLowerCase()}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Selected Place Detail Spotlight Card */}
            {selectedPlace ? (
              <div className="bg-slate-900/60 border border-white/5 rounded-lg p-3 space-y-3.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 font-mono tracking-wider uppercase">
                      Spotlight
                    </span>
                    <h3 className="text-sm font-bold text-white mt-1.5 leading-tight">{selectedPlace.displayName}</h3>
                  </div>
                  
                  {/* Bookmark toggle */}
                  <button
                    onClick={() => toggleStar(selectedPlace.id)}
                    className="p-1.5 rounded-md hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <Icons.Star
                      className={`w-4 h-4 ${
                        starredIds.includes(selectedPlace.id)
                          ? 'fill-amber-500 text-amber-500'
                          : 'text-slate-400 hover:text-amber-400'
                      }`}
                    />
                  </button>
                </div>

                {/* Photo rendering with safe fallback / getURI check */}
                {selectedPlace.photos && selectedPlace.photos.length > 0 ? (
                  <div className="h-28 w-full rounded overflow-hidden relative border border-white/5">
                    <img
                      src={selectedPlace.photos[0].getURI({ maxWidth: 400 })}
                      alt={selectedPlace.displayName || 'place preview'}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  </div>
                ) : (
                  <div className="h-20 w-full bg-slate-950 border border-white/5 rounded flex items-center justify-center text-slate-600 gap-1.5">
                    <Icons.ImageOff className="w-4 h-4" />
                    <span className="text-[10px] font-mono">No photostream</span>
                  </div>
                )}

                {/* Address representation */}
                <div className="space-y-1">
                  <span className="text-[9px] text-slate-500 uppercase tracking-widest font-mono">Postal Address</span>
                  <p className="text-xs text-slate-300 leading-relaxed bg-black/30 border border-white/5 p-2 rounded">
                    {selectedPlace.formattedAddress || 'No coordinates detail'}
                  </p>
                </div>

                {/* Place Types / Rating details */}
                <div className="flex items-center justify-between text-xs font-mono text-slate-400 py-0.5 border-t border-b border-white/5">
                  <span className="truncate max-w-[150px]">
                    Type: {selectedPlace.types ? selectedPlace.types[0]?.replace('_', ' ') || 'Establishment' : 'Establishment'}
                  </span>
                  {selectedPlace.rating && (
                    <div className="flex items-center gap-0.5 text-amber-400">
                      <Icons.Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      <span>{selectedPlace.rating}</span>
                    </div>
                  )}
                </div>

                {/* Actions bottom */}
                <div className="flex gap-1.5 pt-0.5">
                  <button
                    onClick={() => calculateRoute(selectedPlace)}
                    className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-500 border border-blue-400/30 rounded text-xs font-semibold text-white flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Icons.Navigation className="w-3.5 h-3.5" />
                    Get Directions
                  </button>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedPlace.displayName || '')}&query_place_id=${selectedPlace.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 border border-white/5 rounded text-xs text-slate-300 hover:text-white flex items-center justify-center transition-colors"
                    title="External Full Map view"
                  >
                    <Icons.ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-2.5 border border-white/5 border-dashed rounded-lg bg-slate-900/10">
                <Icons.MapPin className="w-10 h-10 stroke-[1.1] opacity-35 text-slate-400" />
                <div className="text-xs font-bold text-slate-400">No Location Spotlighted</div>
                <p className="text-[10px] text-slate-500 leading-relaxed max-w-xs">
                  Type an address or search quick bookmarks above. Click any map pin to inspect reviews, photo galleries, and routes.
                </p>
              </div>
            )}

            {/* Places Results Lists */}
            {places.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-white/5 text-xs">
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono block mb-1">Search Results ({places.length})</span>
                <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-0.5">
                  {places.map(p => {
                    const isSelected = selectedPlace?.id === p.id;
                    return (
                      <div
                        key={p.id}
                        onClick={() => {
                          setSelectedPlace(p);
                          setDestinationPlace(null);
                          setRouteInfo(null);
                        }}
                        className={`p-2 rounded text-left border transition duration-150 cursor-pointer ${
                          isSelected 
                            ? 'bg-amber-600/10 border-amber-500/40 text-white' 
                            : 'bg-black/30 border-white/5 text-slate-400 hover:bg-slate-900 hover:border-white/10'
                        }`}
                      >
                        <div className="font-bold text-[11px] truncate">{p.displayName}</div>
                        <div className="text-[10px] text-slate-500 truncate mt-0.5">{p.formattedAddress}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
