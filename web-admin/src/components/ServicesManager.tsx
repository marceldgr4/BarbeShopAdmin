import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Power, Scissors, Clock, Tag, X } from 'lucide-react';
import { servicesApi } from '../api/api';

export const ServicesManager = () => {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    duration_minutes: 30,
    is_active: true
  });

  const fetchServices = async () => {
    try {
      setLoading(true);
      const response = await servicesApi.getAll();
      if (response.data.success) {
        setServices(response.data.data);
      }
    } catch (err) {
      setError('Error al cargar los servicios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleOpenModal = (service: any = null) => {
    if (service) {
      setEditingService(service);
      setFormData({
        name: service.name,
        description: service.description || '',
        price: service.price,
        duration_minutes: service.duration_minutes,
        is_active: service.is_active
      });
    } else {
      setEditingService(null);
      setFormData({
        name: '',
        description: '',
        price: 0,
        duration_minutes: 30,
        is_active: true
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingService) {
        await servicesApi.update(editingService.id, formData);
      } else {
        await servicesApi.create(formData);
      }
      setIsModalOpen(false);
      fetchServices();
    } catch (err) {
      alert('Error al guardar el servicio');
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await servicesApi.toggle(id);
      fetchServices();
    } catch (err) {
      alert('Error al cambiar el estado');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Scissors className="text-emerald-400" />
          Gestión de Servicios
        </h2>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus size={20} />
          Nuevo Servicio
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service) => (
          <div key={service.id} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl relative group hover:border-emerald-500/50 transition-colors flex flex-col h-full">
             <div className="flex justify-between items-start mb-4">
                <div className="bg-emerald-500/10 p-3 rounded-xl">
                    <Scissors className="text-emerald-400" size={24} />
                </div>
                <div className="flex gap-1">
                    <button onClick={() => handleToggle(service.id)} className={`p-2 rounded-lg transition-colors ${service.is_active ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-500 bg-slate-800'}`}>
                        <Power size={18} />
                    </button>
                    <button onClick={() => handleOpenModal(service)} className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-lg">
                        <Pencil size={18} />
                    </button>
                    <button className="p-2 text-red-400 hover:text-red-300 bg-red-500/10 rounded-lg">
                        <Trash2 size={18} />
                    </button>
                </div>
             </div>

             <h3 className="text-lg font-bold text-white mb-1">{service.name}</h3>
             <p className="text-sm text-slate-400 mb-4 line-clamp-2">{service.description || 'Sin descripción'}</p>
             
             <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-800">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                    <Tag size={16} />
                    ${service.price.toLocaleString()}
                </div>
                <div className="flex items-center gap-1 text-slate-400 text-sm">
                    <Clock size={16} />
                    {service.duration_minutes} min
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
                {editingService ? 'Editar Servicio' : 'Nuevo Servicio'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Nombre del Servicio</label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-500"
                  placeholder="Ej. Corte de Cabello"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Descripción</label>
                <textarea 
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Precio ($)</label>
                  <input 
                    type="number" 
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: Number(e.target.value)})}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Duración (min)</label>
                  <input 
                    type="number" 
                    required
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData({...formData, duration_minutes: Number(e.target.value)})}
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
