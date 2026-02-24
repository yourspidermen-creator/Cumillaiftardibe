import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Mosque } from '@/data/mosques';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapProps {
  mosques: Mosque[];
}

export function IftarMap({ mosques }: MapProps) {
  return (
    <div className="w-full h-[400px] rounded-xl overflow-hidden shadow-lg border border-zinc-100 z-0">
      <MapContainer 
        center={[23.4606, 91.1809]} 
        zoom={13} 
        scrollWheelZoom={false} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {mosques.map((mosque) => (
          <Marker key={mosque.id} position={[mosque.latitude, mosque.longitude]}>
            <Popup>
              <div className="font-sans">
                <h3 className="font-bold text-zinc-800">{mosque.name}</h3>
                <p className="text-sm text-zinc-600">{mosque.location}</p>
                {mosque.has_biryani && (
                  <span className="inline-block mt-1 px-2 py-0.5 bg-amber-100 text-amber-800 text-xs rounded-full">
                    বিরিয়ানি আছে! 🍗
                  </span>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
