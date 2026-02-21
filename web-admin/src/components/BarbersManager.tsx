import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Power, Users, Star, Mail, X } from 'lucide-react';
import { barbersApi, barbershopsApi } from '../api/api';

export const BarbersManager = () => {
  const [barbers, setBarbers] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [, setLoading] = useState(true);
  const [, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBarber, setEditingBarber] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    branch_id: '',
    bio: '',
    is_active: true
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [barbersRes, branchesRes] = await Promise.all([
        barbersApi.getAll(),
        barbershopsApi.getAll()
      ]);
      
      if (barbersRes.data.success) setBarbers(barbersRes.data.data);
      if (branchesRes.data.success) setBranches(branchesRes.data.data);
    } catch (err) {
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (barber: any = null) => {
    if (barber) {
      setEditingBarber(barber);
      setFormData({
        name: barber.name,
        email: barber.email || '',
        branch_id: barber.branch_id || '',
        bio: barber.bio || '',
        is_active: barber.is_active
      });
    } else {
      setEditingBarber(null);
      setFormData({
        name: '',
        email: '',
        branch_id: branches[0]?.id || '',
        bio: '',
        is_active: true
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingBarber) {
        await barbersApi.update(editingBarber.id, formData);
      } else {
        await barbersApi.create(formData);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      alert('Error al guardar el barbero');
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await barbersApi.toggle(id);
      fetchData();
    } catch (err) {
      alert('Error al cambiar el estado');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Users className="text-purple-400" />
          Gestión de Barberos
        </h2>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus size={20} />
          Nuevo Barbero
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-800/50 text-slate-400 text-sm">
              <th className="p-4 font-medium uppercase">Nombre</th>
              <th className="p-4 font-medium uppercase">Barbería</th>
              <th className="p-4 font-medium uppercase">Estado</th>
              <th className="p-4 font-medium uppercase">Rating</th>
              <th className="p-4 font-medium uppercase text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {barbers.map((barber) => (
              <tr key={barber.id} className="hover:bg-slate-800/30 transition-colors group">
                <td className="p-4">
                  <div className="font-medium text-white">{barber.name}</div>
                  <div className="text-xs text-slate-500 flex items-center gap-1">
                    <Mail size={12} /> {barber.email || 'Sin email'}
                  </div>
                </td>
                <td className="p-4 text-slate-400">
                  {barber.branches?.name || 'No asignada'}
                </td>
                <td className="p-4">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${barber.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                    {barber.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-1 text-amber-400">
                    <Star size={14} fill="currentColor" />
                    <span>{barber.rating || '0'}</span>
                  </div>
                </td>
                <td className="p-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => handleOpenModal(barber)}
                      className="p-2 text-slate-400 hover:text-white transition-colors"
                    >
                      <Pencil size={18} />
                    </button>
                    <button 
                      onClick={() => handleToggle(barber.id)}
                      className={`p-2 transition-colors ${barber.is_active ? 'text-amber-400' : 'text-emerald-400'}`}
                    >
                      <Power size={18} />
                    </button>
                    <button className="p-2 text-red-400 hover:text-red-300 transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">
                {editingBarber ? 'Editar Barbero' : 'Nuevo Barbero'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Nombre Completo</label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
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
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Sucursal / Barbería</label>
                <select 
                  required
                  value={formData.branch_id}
                  onChange={(e) => setFormData({...formData, branch_id: e.target.value})}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-500 appearance-none"
                >
                  <option value="">Seleccionar Sucursal...</option>
                  {branches.map(branch => (
                    <option key={branch.id} value={branch.id}>{branch.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Biografía</label>
                <textarea 
                  rows={3}
                  value={formData.bio}
                  onChange={(e) => setFormData({...formData, bio: e.target.value})}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-500"
                />
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
