import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Power, Store, MapPin, Phone, X } from 'lucide-react';
import { barbershopsApi } from '../api/api';

export const BarbershopsManager = () => {
  const [barbershops, setBarbershops] = useState<any[]>([]);
  const [, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingShop, setEditingShop] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: 'Barranquilla',
    phone: '',
    email: '',
    is_active: true
  });

  const fetchBarbershops = async () => {
    try {
      setLoading(true);
      const response = await barbershopsApi.getAll();
      if (response.data.success) {
        setBarbershops(response.data.data);
      }
    } catch (err) {
      setError('Error al cargar las barberías');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBarbershops();
  }, []);

  const handleOpenModal = (shop: any = null) => {
    if (shop) {
      setEditingShop(shop);
      setFormData({
        name: shop.name,
        address: shop.address,
        city: shop.city,
        phone: shop.phone || '',
        email: shop.email || '',
        is_active: shop.is_active
      });
    } else {
      setEditingShop(null);
      setFormData({
        name: '',
        address: '',
        city: 'Barranquilla',
        phone: '',
        email: '',
        is_active: true
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingShop) {
        await barbershopsApi.update(editingShop.id, formData);
      } else {
        await barbershopsApi.create(formData);
      }
      setIsModalOpen(false);
      fetchBarbershops();
    } catch (err) {
      alert('Error al guardar la barbería');
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await barbershopsApi.toggle(id);
      fetchBarbershops();
    } catch (err) {
      alert('Error al cambiar el estado');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta barbería?')) return;
    try {
      await barbershopsApi.delete(id);
      fetchBarbershops();
    } catch (err) {
      alert('No se pudo eliminar la barbería (puede que tenga citas activas)');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Store className="text-primary-400" />
          Gestión de Barberías
        </h2>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus size={20} />
          Nueva Barbería
        </button>
      </div>

      {error && <div className="text-red-400 bg-red-500/10 p-4 rounded-lg">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {barbershops.map((shop) => (
          <div key={shop.id} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl relative group">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-white">{shop.name}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full ${shop.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                  {shop.is_active ? 'Activa' : 'Inactiva'}
                </span>
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => handleOpenModal(shop)}
                  className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300"
                >
                  <Pencil size={18} />
                </button>
                <button 
                  onClick={() => handleToggle(shop.id)}
                  className={`p-2 rounded-lg ${shop.is_active ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}`}
                >
                  <Power size={18} />
                </button>
                <button 
                  onClick={() => handleDelete(shop.id)}
                  className="p-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
            
            <div className="space-y-2 text-sm text-slate-400">
              <div className="flex items-center gap-2">
                <MapPin size={16} />
                {shop.address}, {shop.city}
              </div>
              <div className="flex items-center gap-2">
                <Phone size={16} />
                {shop.phone || 'Sin teléfono'}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">
                {editingShop ? 'Editar Barbería' : 'Nueva Barbería'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Nombre</label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-500"
                  placeholder="Ej. Barbería Central"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Dirección</label>
                <input 
                  type="text" 
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-500"
                  placeholder="Calle 123 #45-67"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Ciudad</label>
                <input 
                  type="text" 
                  required
                  value={formData.city}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Teléfono</label>
                  <input 
                    type="text" 
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Email</label>
                  <input 
                    type="email" 
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-500"
                  />
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-medium py-2 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-primary-600 hover:bg-primary-500 text-white font-medium py-2 rounded-lg transition-colors"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
