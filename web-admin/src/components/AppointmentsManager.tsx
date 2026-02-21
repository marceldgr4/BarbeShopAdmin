import { useState, useEffect } from 'react';
import { Calendar, CheckCircle, Clock, XCircle, ChevronRight, User } from 'lucide-react';
import { appointmentsApi } from '../api/api';

export const AppointmentsManager = () => {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await appointmentsApi.getAll();
      if (response.data.success) {
        setAppointments(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching appointments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      await appointmentsApi.updateStatus(id, status);
      fetchAppointments();
    } catch (err) {
      alert('Error al actualizar el estado de la cita');
    }
  };

  const getStatusStyle = (status: string) => {
    // Note: status is a UUID now. Ideally we should join with statuses table.
    return 'bg-blue-500/20 text-blue-400';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Calendar className="text-primary-400" />
          Agenda de Citas
        </h2>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-800/50 text-slate-400 text-sm">
                <th className="p-4 font-medium uppercase">Cliente / Fecha</th>
                <th className="p-4 font-medium uppercase">Barbero / Servicio</th>
                <th className="p-4 font-medium uppercase">Estado</th>
                <th className="p-4 font-medium uppercase text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {appointments.map((apt) => (
                <tr key={apt.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="p-4">
                    <div className="font-medium text-white flex items-center gap-2">
                      <User size={14} className="text-slate-500" />
                      {apt.customers?.full_name || 'Cliente Externo'}
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                      <Clock size={12} />
                      {apt.appointment_date} {apt.appointment_time}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="text-sm font-medium text-slate-300">{apt.barbers?.name || 'Desconocido'}</div>
                    <div className="text-xs text-slate-500">{apt.services?.name || 'Servicio'}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{apt.branches?.name}</div>
                  </td>
                  <td className="p-4">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusStyle(apt.status_id)}`}>
                      {apt.status_id.substring(0,8).toUpperCase()}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2 text-sm">
                      {apt.status === 'pending' && (
                        <button 
                          onClick={() => handleStatusUpdate(apt.id, 'confirmed')}
                          className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300"
                        >
                          <CheckCircle size={16} /> Confirmar
                        </button>
                      )}
                      {apt.status !== 'cancelled' && apt.status !== 'completed' && (
                        <button 
                          onClick={() => handleStatusUpdate(apt.id, 'cancelled')}
                          className="flex items-center gap-1 text-red-400 hover:text-red-300"
                        >
                          <XCircle size={16} /> Cancelar
                        </button>
                      )}
                      <button className="text-slate-400 hover:text-white ml-2">
                        <ChevronRight size={20} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
