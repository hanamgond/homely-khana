'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Loader2, Sun, Moon } from 'lucide-react';
import AddMenuModal from '@/components/menu/AddMenuModal';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function AdminMenuPage() {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Date Logic State
  const [weekOffset, setWeekOffset] = useState(0); // 0 = This Week, 1 = Next Week
  const [weekDates, setWeekDates] = useState([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [selectedType, setSelectedType] = useState('Lunch');

  // Calculate Dates whenever weekOffset changes
  useEffect(() => {
    const getMonday = (d) => {
      d = new Date(d);
      const day = d.getDay(),
      diff = d.getDate() - day + (day === 0 ? -6 : 1); 
      return new Date(d.setDate(diff));
    };

    const startOfWeek = getMonday(new Date());
    // Add offset (weeks * 7 days)
    startOfWeek.setDate(startOfWeek.getDate() + (weekOffset * 7));

    const dates = DAYS.map((_, i) => {
        const d = new Date(startOfWeek);
        d.setDate(startOfWeek.getDate() + i);
        return d.getDate(); // Just the day number (e.g., 19, 20)
    });

    setWeekDates(dates);
  }, [weekOffset]);

  const fetchMenu = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_URL}/api/menu/weekly`);
      const data = await res.json();
      if (data.success) {
        setMenuItems(Object.values(data.data).flat());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMenu(); }, []); // Fetch once on load

  const handleAdd = (day, type) => {
    setEditingItem(null);
    setSelectedDay(day);
    setSelectedType(type);
    setIsModalOpen(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
      if(!confirm("Delete this item?")) return;
      await fetch(`${process.env.NEXT_PUBLIC_URL}/api/menu/delete/${id}`, { method: 'DELETE' });
      fetchMenu();
  };

  const getSlotItem = (day, type) => {
      // In a real app, you would filter by weekOffset too if your DB supports dates
      return menuItems.find(item => item.day_of_week === day && item.meal_type === type);
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10 px-8 py-5 shadow-sm">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
             <h1 className="text-2xl font-bold text-gray-900">Weekly Menu Manager</h1>
             <p className="text-sm text-gray-500">Plan and edit the schedule seen by customers</p>
          </div>

          {/* Week Toggle */}
          <div className="bg-gray-100 p-1.5 rounded-full flex gap-1 border border-gray-200">
             <button 
                onClick={() => setWeekOffset(0)}
                className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${
                   weekOffset === 0 ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                }`}
             >
                This Week
             </button>
             <button 
                onClick={() => setWeekOffset(1)}
                className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${
                   weekOffset === 1 ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                }`}
             >
                Next Week
             </button>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="max-w-[1600px] mx-auto p-8">
        {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="animate-spin text-orange-500" size={40}/></div>
        ) : (
            <div className="space-y-6">
                {/* Column Headers */}
                <div className="hidden md:grid grid-cols-12 gap-6 px-6 text-xs font-bold text-gray-400 uppercase tracking-widest">
                    <div className="col-span-1">Day</div>
                    <div className="col-span-11 grid grid-cols-2 gap-6">
                        <div>Lunch Option</div>
                        <div>Dinner Option</div>
                    </div>
                </div>

                {DAYS.map((day, index) => {
                    const lunchItem = getSlotItem(day, 'Lunch');
                    const dinnerItem = getSlotItem(day, 'Dinner');
                    const dateDisplay = weekDates[index]; 

                    return (
                        <div key={day} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col md:flex-row hover:shadow-md transition-shadow">
                            
                            {/* Date Column */}
                            <div className="w-full md:w-32 bg-gray-50 md:border-r border-b md:border-b-0 border-gray-100 p-6 flex flex-row md:flex-col items-center justify-between md:justify-center text-center">
                                <div>
                                    <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider">{day.substring(0,3)}</span>
                                    <span className="block text-3xl font-serif font-medium text-gray-800 mt-1">{dateDisplay}</span>
                                </div>
                            </div>

                            {/* Meal Slots */}
                            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2">
                                {/* Lunch */}
                                <div className="p-6 border-b lg:border-b-0 lg:border-r border-gray-100 relative group">
                                    <div className="mb-4 flex items-center gap-2 md:hidden">
                                        <Sun size={18} className="text-orange-400" />
                                        <span className="text-xs font-bold text-gray-400 tracking-widest uppercase">LUNCH</span>
                                    </div>
                                    <AdminMealCard item={lunchItem} type="Lunch" onAdd={() => handleAdd(day, 'Lunch')} onEdit={handleEdit} />
                                </div>

                                {/* Dinner */}
                                <div className="p-6 relative group">
                                    <div className="mb-4 flex items-center gap-2 md:hidden">
                                        <Moon size={18} className="text-indigo-400" />
                                        <span className="text-xs font-bold text-gray-400 tracking-widest uppercase">DINNER</span>
                                    </div>
                                    <AdminMealCard item={dinnerItem} type="Dinner" onAdd={() => handleAdd(day, 'Dinner')} onEdit={handleEdit} />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        )}
      </div>

      <AddMenuModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onRefresh={fetchMenu}
        editingItem={editingItem}
        initialDay={selectedDay}
        initialType={selectedType}
      />
    </div>
  );
}

// Sub-component remains same as previous step
function AdminMealCard({ item, type, onAdd, onEdit }) {
    if (!item) {
        return (
            <button onClick={onAdd} className="w-full h-40 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-orange-300 hover:text-orange-600 hover:bg-orange-50/50 transition-all group">
                <Plus size={24} className="mb-2 opacity-50 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium">Add {type}</span>
            </button>
        );
    }
    return (
        <div className="flex flex-col h-full justify-between relative">
            <div>
                <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold text-gray-900 font-serif leading-tight">{item.title}</h3>
                    <button onClick={() => onEdit(item)} className="p-2 bg-gray-100 hover:bg-orange-100 text-gray-600 hover:text-orange-600 rounded-lg transition-colors">
                        <Edit2 size={16} />
                    </button>
                </div>
                <p className="text-sm text-gray-500 mb-4 line-clamp-2 leading-relaxed">{item.description}</p>
            </div>
            <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50">
                <div className="flex gap-2">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${item.is_veg ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{item.is_veg ? 'VEG' : 'NON-VEG'}</span>
                    {item.tags && item.tags.map && item.tags.map(tag => (
                        <span key={tag} className="px-2 py-1 rounded text-[10px] font-bold uppercase bg-orange-50 text-orange-700">{tag}</span>
                    ))}
                </div>
                <span className="text-sm font-semibold text-gray-400">{item.calories} kcal</span>
            </div>
        </div>
    );
}