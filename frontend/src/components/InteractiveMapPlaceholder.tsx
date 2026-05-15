"use client";

export default function InteractiveMapPlaceholder() {
  return (
    <div className="relative w-full h-full bg-zinc-100 rounded-3xl overflow-hidden border border-zinc-200">
      {/* Mock Map Background */}
      <div 
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage: `radial-gradient(#cbd5e1 1px, transparent 1px)`,
          backgroundSize: '20px 20px'
        }}
      />
      
      {/* Mock Map Markers */}
      <div className="absolute top-1/4 left-1/3 group cursor-pointer">
        <div className="bg-white p-2 rounded-lg shadow-lg border border-zinc-200 flex items-center gap-2 transform group-hover:-translate-y-1 transition-transform">
          <span className="text-xl">🏛️</span>
          <div className="text-xs">
            <p className="font-bold">Museo del Prado</p>
            <p className="text-zinc-500">Atracción</p>
          </div>
        </div>
        <div className="w-0.5 h-4 bg-zinc-400 mx-auto" />
        <div className="w-2 h-2 bg-blue-600 rounded-full mx-auto shadow-sm" />
      </div>

      <div className="absolute bottom-1/3 right-1/4 group cursor-pointer">
        <div className="bg-white p-2 rounded-lg shadow-lg border border-zinc-200 flex items-center gap-2 transform group-hover:-translate-y-1 transition-transform">
          <span className="text-xl">🍕</span>
          <div className="text-xs">
            <p className="font-bold">Pizzería Napoli</p>
            <p className="text-zinc-500">Restaurante</p>
          </div>
        </div>
        <div className="w-0.5 h-4 bg-zinc-400 mx-auto" />
        <div className="w-2 h-2 bg-red-500 rounded-full mx-auto shadow-sm" />
      </div>

      {/* Map Controls */}
      <div className="absolute bottom-6 right-6 flex flex-col gap-2">
        <button className="w-10 h-10 bg-white rounded-xl shadow-md border border-zinc-100 flex items-center justify-center font-bold text-lg hover:bg-zinc-50">+</button>
        <button className="w-10 h-10 bg-white rounded-xl shadow-md border border-zinc-100 flex items-center justify-center font-bold text-lg hover:bg-zinc-50">-</button>
      </div>

      {/* Map Overlay Text */}
      <div className="absolute top-6 left-6 bg-white/80 backdrop-blur-md px-4 py-2 rounded-full border border-zinc-200 shadow-sm text-sm font-medium">
        📍 Madrid, España
      </div>
    </div>
  );
}
