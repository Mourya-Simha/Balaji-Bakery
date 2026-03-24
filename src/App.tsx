import React, { useState, useEffect } from 'react';
import { 
  Cake, MapPin, Phone, Clock, Plus, Trash2, Lock, X, 
  Image as ImageIcon, Info, Tag, Weight, IndianRupee, LogOut, LogIn, Edit2, Calendar, User as UserIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db } from './firebase';
import { 
  signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, User 
} from 'firebase/auth';
import { 
  collection, doc, setDoc, getDoc, deleteDoc, onSnapshot, query, orderBy, serverTimestamp 
} from 'firebase/firestore';

// --- Types ---
interface CakeItem {
  id: string;
  name: string;
  ingredients: string;
  category: string;
  kgs: string;
  price: number;
  imageUrl: string;
  createdAt?: any;
}

// --- Error Handling ---
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  alert(`Error: ${errInfo.error}`);
}

const DEFAULT_CAKES: Omit<CakeItem, 'id'>[] = [
  { name: "Chocolate Lava Cake", ingredients: "Dark Chocolate, Butter, Flour, Eggs, Sugar", category: "Hot Cake", kgs: "250g", price: 350, imageUrl: "https://images.unsplash.com/photo-1624353365286-3f8d62daad51?auto=format&fit=crop&q=80&w=1000" },
  { name: "Classic Black Forest", ingredients: "Chocolate Sponge, Cherry Filling, Whipped Cream", category: "Party Cake", kgs: "1kg - 3kg", price: 850, imageUrl: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&q=80&w=1000" },
  { name: "Red Velvet Delight", ingredients: "Red Velvet Sponge, Cream Cheese Frosting", category: "Professional Cake", kgs: "1kg - 2kg", price: 950, imageUrl: "https://images.unsplash.com/photo-1616541823729-00fe0aacd32c?auto=format&fit=crop&q=80&w=1000" },
  { name: "Pineapple Cool Cake", ingredients: "Vanilla Sponge, Fresh Pineapple, Whipped Cream", category: "Cooling Cake", kgs: "500g - 2kg", price: 600, imageUrl: "https://images.unsplash.com/photo-1559620192-032c4bc4674e?auto=format&fit=crop&q=80&w=1000" },
  { name: "Vanilla Sponge", ingredients: "Flour, Butter, Vanilla Extract, Eggs", category: "Normal Cake", kgs: "500g", price: 400, imageUrl: "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?auto=format&fit=crop&q=80&w=1000" },
  { name: "Strawberry Fresh Cream", ingredients: "Vanilla Sponge, Fresh Strawberries, Cream", category: "Party Cake", kgs: "1kg - 2kg", price: 750, imageUrl: "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?auto=format&fit=crop&q=80&w=1000" },
  { name: "Butterscotch Crunch", ingredients: "Butterscotch Sponge, Caramel, Praline", category: "Cooling Cake", kgs: "1kg - 3kg", price: 800, imageUrl: "https://images.unsplash.com/photo-1542826438-bd32f43d626f?auto=format&fit=crop&q=80&w=1000" },
  { name: "Mango Fruit Cake", ingredients: "Vanilla Sponge, Fresh Mango Pulp, Cream", category: "Cooling Cake", kgs: "1kg", price: 850, imageUrl: "https://images.unsplash.com/photo-1571115177098-24ec42ed204d?auto=format&fit=crop&q=80&w=1000" },
  { name: "Blueberry Cheesecake", ingredients: "Cream Cheese, Graham Cracker, Blueberries", category: "Professional Cake", kgs: "1kg", price: 1200, imageUrl: "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&q=80&w=1000" },
  { name: "Choco Truffle", ingredients: "Chocolate Sponge, Dark Chocolate Ganache", category: "Party Cake", kgs: "1kg - 5kg", price: 900, imageUrl: "https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&q=80&w=1000" },
  { name: "White Forest", ingredients: "Vanilla Sponge, White Chocolate, Cherries", category: "Normal Cake", kgs: "1kg - 2kg", price: 800, imageUrl: "https://images.unsplash.com/photo-1588195538326-c5b1e9f80a1b?auto=format&fit=crop&q=80&w=1000" },
  { name: "Ferrero Rocher Premium", ingredients: "Chocolate Sponge, Nutella, Hazelnuts", category: "Professional Cake", kgs: "1kg - 3kg", price: 1500, imageUrl: "https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?auto=format&fit=crop&q=80&w=1000" },
  { name: "Coffee Walnut Cake", ingredients: "Coffee Sponge, Walnuts, Espresso Buttercream", category: "Normal Cake", kgs: "500g - 1kg", price: 650, imageUrl: "https://images.unsplash.com/photo-1517686469429-8bdb88b9f907?auto=format&fit=crop&q=80&w=1000" },
  { name: "Pistachio Rose Cake", ingredients: "Pistachio Sponge, Rose Water, Buttercream", category: "Party Cake", kgs: "1kg", price: 1100, imageUrl: "https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&q=80&w=1000" },
  { name: "Lemon Drizzle Cake", ingredients: "Lemon Zest, Flour, Sugar, Butter", category: "Normal Cake", kgs: "500g", price: 450, imageUrl: "https://images.unsplash.com/photo-1519869325930-281384150729?auto=format&fit=crop&q=80&w=1000" },
  { name: "Caramel Macchiato Cake", ingredients: "Coffee Sponge, Caramel Sauce, Cream", category: "Professional Cake", kgs: "1kg - 2kg", price: 1000, imageUrl: "https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?auto=format&fit=crop&q=80&w=1000" },
  { name: "Dark Chocolate Fudge", ingredients: "Dark Chocolate, Cocoa, Butter, Sugar", category: "Hot Cake", kgs: "500g - 1kg", price: 700, imageUrl: "https://images.unsplash.com/photo-1602351447937-745cb720612f?auto=format&fit=crop&q=80&w=1000" },
  { name: "Mixed Fruit Gateau", ingredients: "Vanilla Sponge, Fresh Seasonal Fruits, Cream", category: "Cooling Cake", kgs: "1kg - 3kg", price: 900, imageUrl: "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&q=80&w=1000" },
  { name: "Oreo Cookies & Cream", ingredients: "Chocolate Sponge, Crushed Oreos, Cream", category: "Party Cake", kgs: "1kg - 2kg", price: 850, imageUrl: "https://images.unsplash.com/photo-1571115177098-24ec42ed204d?auto=format&fit=crop&q=80&w=1000" },
  { name: "Rainbow Celebration Cake", ingredients: "Multi-colored Sponge, Vanilla Buttercream", category: "Party Cake", kgs: "2kg - 5kg", price: 1800, imageUrl: "https://images.unsplash.com/photo-1587668178277-295251f900ce?auto=format&fit=crop&q=80&w=1000" }
];

export default function App() {
  // --- State ---
  const [cakes, setCakes] = useState<CakeItem[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  
  // Admin State
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminLoginModal, setShowAdminLoginModal] = useState(false);
  const [adminCreds, setAdminCreds] = useState({ username: '', password: '' });
  
  // Modals
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedCake, setSelectedCake] = useState<CakeItem | null>(null);
  const [editingCakeId, setEditingCakeId] = useState<string | null>(null);
  const [cakeToDelete, setCakeToDelete] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{title: string, type: 'success' | 'error' | 'info'} | null>(null);

  const showToast = (title: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage({ title, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Forms
  const [newCake, setNewCake] = useState({
    imageUrl: '',
    name: '',
    ingredients: '',
    category: '',
    kgs: '',
    price: ''
  });
  
  const [orderForm, setOrderForm] = useState({
    name: '',
    quantity: 1,
    date: '',
    time: '',
    specialInstructions: ''
  });

  const [appointmentForm, setAppointmentForm] = useState({
    name: '',
    date: '',
    time: '',
    details: ''
  });

  // --- Effects ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isAuthReady) return;

    // Seed database if empty
    const checkAndSeed = async () => {
      if (!localStorage.getItem('seeded_cakes')) {
        localStorage.setItem('seeded_cakes', 'true');
        for (const cake of DEFAULT_CAKES) {
          try {
            await setDoc(doc(collection(db, 'cakes')), { ...cake, createdAt: serverTimestamp() });
          } catch (e) {
            console.error("Failed to seed cake", e);
          }
        }
      }
    };
    checkAndSeed();

    const q = query(collection(db, 'cakes'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const cakeData: CakeItem[] = [];
      snapshot.forEach((doc) => {
        cakeData.push({ id: doc.id, ...doc.data() } as CakeItem);
      });
      setCakes(cakeData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'cakes');
    });

    return () => unsubscribe();
  }, [isAuthReady]);

  // --- Handlers ---
  const handleCustomerLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
        console.log("Login popup closed by user.");
      } else {
        console.error("Login failed", error);
        showToast(`Login failed: ${error.message || 'Unknown error'}`, 'error');
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsAdmin(false); // Reset admin state on logout
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const handleAdminLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Default Owner Credentials
    if (adminCreds.username === 'admin' && adminCreds.password === 'balaji123') {
      setIsAdmin(true);
      setShowAdminLoginModal(false);
      setAdminCreds({ username: '', password: '' });
      showToast('Welcome to the Owner Portal!', 'success');
    } else {
      showToast('Invalid credentials. Please try again.', 'error');
    }
  };

  const handleSaveCake = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCake.name || !newCake.price) {
      showToast('Please fill in at least the name and price.', 'error');
      return;
    }

    try {
      const cakeData = {
        name: newCake.name,
        ingredients: newCake.ingredients,
        category: newCake.category,
        kgs: newCake.kgs,
        price: Number(newCake.price),
        imageUrl: newCake.imageUrl || 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&q=80&w=1000&ixlib=rb-4.0.3',
        createdAt: serverTimestamp()
      };

      if (editingCakeId) {
        delete (cakeData as any).createdAt;
        await setDoc(doc(db, 'cakes', editingCakeId), cakeData, { merge: true });
        showToast('Cake updated successfully!', 'success');
      } else {
        const newDocRef = doc(collection(db, 'cakes'));
        await setDoc(newDocRef, cakeData);
        showToast('Cake added successfully!', 'success');
      }

      setNewCake({ imageUrl: '', name: '', ingredients: '', category: '', kgs: '', price: '' });
      setEditingCakeId(null);
      setShowAdminModal(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'cakes');
    }
  };

  const handleEditClick = (cake: CakeItem) => {
    setNewCake({
      imageUrl: cake.imageUrl,
      name: cake.name,
      ingredients: cake.ingredients,
      category: cake.category,
      kgs: cake.kgs,
      price: cake.price.toString()
    });
    setEditingCakeId(cake.id);
    setShowAdminModal(true);
  };

  const handleRemoveCake = async (id: string) => {
    setCakeToDelete(id);
  };

  const confirmDeleteCake = async () => {
    if (!cakeToDelete) return;
    try {
      await deleteDoc(doc(db, 'cakes', cakeToDelete));
      showToast('Cake removed successfully!', 'success');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `cakes/${cakeToDelete}`);
    }
    setCakeToDelete(null);
  };

  const openOrderModal = (cake: CakeItem) => {
    setSelectedCake(cake);
    setShowOrderModal(true);
  };

  const handleOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCake) return;

    const phoneNumber = "918985587878";
    const message = `*New Order from Balaji Bakery Website*%0A%0A*Customer:* ${orderForm.name}%0A*Item:* ${selectedCake.name}%0A*Quantity:* ${orderForm.quantity} (${selectedCake.kgs})%0A*Price:* ₹${selectedCake.price * orderForm.quantity}%0A*Pickup Date:* ${orderForm.date}%0A*Pickup Time:* ${orderForm.time}%0A*Special Instructions:* ${orderForm.specialInstructions || 'None'}%0A%0APlease confirm my order.`;
    
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
    setShowOrderModal(false);
    setOrderForm({ name: '', quantity: 1, date: '', time: '', specialInstructions: '' });
  };

  const handleAppointmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const phoneNumber = "918985587878";
    const message = `*New Cake Appointment / Consultation*%0A%0A*Name:* ${appointmentForm.name}%0A*Date:* ${appointmentForm.date}%0A*Time:* ${appointmentForm.time}%0A*Details:* ${appointmentForm.details}%0A%0AI would like to discuss a cake order.`;
    
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
    setAppointmentForm({ name: '', date: '', time: '', details: '' });
  };

  if (!isAuthReady) {
    return <div className="min-h-screen flex items-center justify-center bg-[#fdfbf7]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div></div>;
  }

  return (
    <div className="min-h-screen bg-[#fdfbf7] font-sans text-stone-800">
      
      {/* --- Navbar --- */}
      <nav className="bg-amber-900 text-amber-50 sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center gap-3">
              <Cake className="h-8 w-8 text-amber-300" />
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Balaji Bakery</h1>
                <p className="text-xs text-amber-200/80 uppercase tracking-wider">Rajamahendravaram</p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-6 text-sm font-medium">
              <a href="#menu" className="hover:text-amber-300 transition-colors">Our Menu</a>
              <a href="#about" className="hover:text-amber-300 transition-colors">About Us</a>
              <a href="#contact" className="hover:text-amber-300 transition-colors">Contact</a>
              
              <div className="flex items-center gap-4 ml-4 border-l border-amber-700 pl-4">
                {user ? (
                  <>
                    <span className="text-amber-200">{user.displayName || user.email}</span>
                    <button 
                      onClick={handleLogout}
                      className="text-amber-200 hover:text-white transition-colors"
                      title="Logout"
                    >
                      <LogOut className="w-5 h-5" />
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={handleCustomerLogin}
                    className="bg-white text-amber-900 hover:bg-amber-100 px-4 py-2 rounded-md transition-colors flex items-center gap-2 font-bold"
                  >
                    <LogIn className="w-4 h-4" /> Customer Login
                  </button>
                )}
                
                {/* Owner Portal Button */}
                {!isAdmin ? (
                  <button 
                    onClick={() => setShowAdminLoginModal(true)}
                    className="bg-amber-700 hover:bg-amber-600 text-white px-4 py-2 rounded-md transition-colors flex items-center gap-2 font-bold"
                  >
                    <Lock className="w-4 h-4" /> Owner Portal
                  </button>
                ) : (
                  <button 
                    onClick={() => setIsAdmin(false)}
                    className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-md transition-colors flex items-center gap-2 font-bold"
                  >
                    <LogOut className="w-4 h-4" /> Exit Owner Portal
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* --- Hero Section --- */}
      <div className="relative bg-amber-800 text-white">
        <div className="absolute inset-0 overflow-hidden">
          <img 
            src="https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&q=80&w=2000&ixlib=rb-4.0.3" 
            alt="Bakery Background" 
            className="w-full h-full object-cover opacity-20"
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32 flex flex-col items-center text-center">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6"
          >
            Freshly Baked <span className="text-amber-300">Every Day</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg md:text-xl max-w-2xl text-amber-100 mb-10"
          >
            Serving the best breads, cakes, pastries, puffs, and biscuits in Rajamahendravaram for over 15 years. Quality and taste you can trust.
          </motion.p>
          <motion.a 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            href="#menu" 
            className="bg-amber-400 text-amber-950 hover:bg-amber-300 px-8 py-4 rounded-full font-bold text-lg transition-transform hover:scale-105 shadow-lg"
          >
            Explore Our Menu
          </motion.a>
        </div>
      </div>

      {/* --- About Us Section --- */}
      <div id="about" className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-amber-950 mb-4">About Us</h2>
          <div className="w-24 h-1 bg-amber-400 mx-auto rounded-full mb-8"></div>
          <p className="text-lg text-stone-600 max-w-3xl mx-auto leading-relaxed">
            Welcome to Balaji Bakery, a cornerstone of Rajamahendravaram's culinary heritage. For over 15 years, we have been dedicated to crafting the finest baked goods using traditional recipes and the freshest ingredients. From our signature occasional cakes to our daily fresh breads and puffs, every item is baked with love and a commitment to quality. Whether you are celebrating a special milestone or just craving a sweet treat, Balaji Bakery is here to make your moments memorable.
          </p>
        </div>
      </div>

      {/* --- Menu Section --- */}
      <div id="menu" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-amber-950 mb-4">Our Delicious Menu</h2>
          <div className="w-24 h-1 bg-amber-400 mx-auto rounded-full mb-6"></div>
          
          {/* Admin "Add New Product" Button */}
          {isAdmin && (
            <div className="mb-8">
              <p className="text-amber-800 font-medium mb-4">Total Products in Menu: {cakes.length}</p>
              <button 
                onClick={() => {
                  setEditingCakeId(null);
                  setNewCake({ imageUrl: '', name: '', ingredients: '', category: '', kgs: '', price: '' });
                  setShowAdminModal(true);
                }}
                className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-full font-bold transition-transform hover:scale-105 shadow-lg flex items-center gap-2 mx-auto"
              >
                <Plus className="w-5 h-5" /> Add New Product
              </button>
            </div>
          )}
        </div>

        {cakes.length === 0 ? (
          <div className="text-center py-12 text-stone-500">
            <p>No items in the menu yet. {isAdmin && "Click 'Add New Product' to add some!"}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence>
              {cakes.map((cake) => (
                <motion.div 
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  key={cake.id} 
                  className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-shadow duration-300 border border-stone-100 overflow-hidden group relative flex flex-col"
                >
                  
                  {/* Admin Controls */}
                  {isAdmin && (
                    <div className="absolute top-4 right-4 z-10 flex gap-2">
                      <button 
                        onClick={() => handleEditClick(cake)}
                        className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full shadow-lg transition-transform hover:scale-110"
                        title="Edit this cake"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleRemoveCake(cake.id)}
                        className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-lg transition-transform hover:scale-110"
                        title="Remove this cake"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  <div className="h-56 overflow-hidden relative">
                    <img 
                      src={cake.imageUrl} 
                      alt={cake.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&q=80&w=1000&ixlib=rb-4.0.3';
                      }}
                    />
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-amber-900 shadow-sm">
                      {cake.category}
                    </div>
                  </div>
                  
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-bold text-stone-800 leading-tight">{cake.name}</h3>
                      <span className="text-lg font-extrabold text-amber-600 bg-amber-50 px-2 py-1 rounded-md">₹{cake.price}</span>
                    </div>
                    
                    <p className="text-sm text-stone-500 mb-4 line-clamp-2 min-h-[2.5rem] flex-1">
                      {cake.ingredients}
                    </p>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-stone-100 mt-auto">
                      <span className="text-sm font-medium text-stone-600 flex items-center gap-1">
                        <Weight className="w-4 h-4 text-amber-500" /> {cake.kgs}
                      </span>
                      <button 
                        onClick={() => openOrderModal(cake)}
                        className="bg-amber-100 text-amber-800 hover:bg-amber-200 px-4 py-2 rounded-lg font-bold text-sm transition-colors flex items-center gap-2"
                      >
                        Click and Pay
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* --- Footer & Contact --- */}
      <footer id="contact" className="bg-stone-900 text-stone-300 py-12 border-t-4 border-amber-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-12">
          
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Cake className="h-6 w-6 text-amber-500" />
              <h3 className="text-xl font-bold text-white">Balaji Bakery</h3>
            </div>
            <p className="text-sm text-stone-400 mb-6 max-w-xs">
              Your favorite local bakery serving fresh, hygienic, and delicious treats every single day.
            </p>
            <h4 className="text-lg font-bold text-white mb-4">Visit Us</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-amber-500 shrink-0" />
                <span>6-5-90, Main Rd, opp. Neerus Delux Centre, Innespeta, Rajamahendravaram, AP 533101</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-amber-500 shrink-0" />
                <a href="https://wa.me/918985587878" target="_blank" rel="noreferrer" className="hover:text-amber-400 transition-colors">
                  089855 87878 (WhatsApp Available)
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-bold text-white mb-4">Hours</h4>
            <ul className="space-y-4 text-sm">
              <li className="flex items-center gap-3 bg-stone-800 p-3 rounded-lg">
                <Clock className="w-5 h-5 text-amber-500 shrink-0" />
                <span>Mon - Sun: 9:00 AM – 9:30 PM</span>
              </li>
            </ul>

            {/* Appointment / Booking Section */}
            <div className="mt-8">
              <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber-500" /> Book Your Cake
              </h4>
              <form onSubmit={handleAppointmentSubmit} className="bg-stone-800 p-4 rounded-lg space-y-3">
                <input 
                  required type="text" placeholder="Your Name" 
                  value={appointmentForm.name} onChange={e => setAppointmentForm({...appointmentForm, name: e.target.value})}
                  className="w-full px-3 py-2 bg-stone-700 border border-stone-600 rounded text-white text-sm focus:outline-none focus:border-amber-500" 
                />
                <div className="grid grid-cols-2 gap-3">
                  <input 
                    required type="date" 
                    value={appointmentForm.date} onChange={e => setAppointmentForm({...appointmentForm, date: e.target.value})}
                    className="w-full px-3 py-2 bg-stone-700 border border-stone-600 rounded text-white text-sm focus:outline-none focus:border-amber-500" 
                  />
                  <input 
                    required type="time" 
                    value={appointmentForm.time} onChange={e => setAppointmentForm({...appointmentForm, time: e.target.value})}
                    className="w-full px-3 py-2 bg-stone-700 border border-stone-600 rounded text-white text-sm focus:outline-none focus:border-amber-500" 
                  />
                </div>
                <textarea 
                  required placeholder="Occasion / Details (e.g. Birthday Cake)" rows={2}
                  value={appointmentForm.details} onChange={e => setAppointmentForm({...appointmentForm, details: e.target.value})}
                  className="w-full px-3 py-2 bg-stone-700 border border-stone-600 rounded text-white text-sm focus:outline-none focus:border-amber-500 resize-none" 
                />
                <button type="submit" className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 rounded transition-colors text-sm">
                  Submit Appointment
                </button>
              </form>
            </div>
          </div>

        </div>
      </footer>

      {/* --- Admin Login Modal --- */}
      <AnimatePresence>
        {showAdminLoginModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-sm relative overflow-hidden"
            >
              <div className="bg-amber-900 p-6 text-center relative">
                <button 
                  onClick={() => setShowAdminLoginModal(false)}
                  className="absolute top-4 right-4 text-amber-200 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-8 h-8 text-amber-900" />
                </div>
                <h3 className="text-2xl font-bold text-white">Owner Portal</h3>
                <p className="text-amber-200 text-sm mt-1">Balaji Bakery Admin Access</p>
              </div>
              
              <form onSubmit={handleAdminLoginSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1 flex items-center gap-2">
                    <UserIcon className="w-4 h-4" /> Username
                  </label>
                  <input 
                    required type="text" 
                    value={adminCreds.username} onChange={e => setAdminCreds({...adminCreds, username: e.target.value})} 
                    className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none" 
                    placeholder="Enter owner username" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1 flex items-center gap-2">
                    <Lock className="w-4 h-4" /> Password
                  </label>
                  <input 
                    required type="password" 
                    value={adminCreds.password} onChange={e => setAdminCreds({...adminCreds, password: e.target.value})} 
                    className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none" 
                    placeholder="Enter owner password" 
                  />
                </div>
                <div className="pt-2">
                  <button type="submit" className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-4 rounded-lg transition-colors shadow-md">
                    Login to Portal
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- Add New Product (Admin) Modal --- */}
      <AnimatePresence>
        {showAdminModal && isAdmin && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4 overflow-y-auto py-8"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl relative my-auto"
            >
              <div className="bg-amber-100 px-6 py-4 border-b border-amber-200 flex justify-between items-center rounded-t-2xl">
                <h3 className="text-xl font-bold text-amber-900 flex items-center gap-2">
                  <Plus className="w-5 h-5" /> {editingCakeId ? 'Edit Product' : 'Add New Product'}
                </h3>
                <button 
                  onClick={() => setShowAdminModal(false)}
                  className="text-amber-700 hover:text-amber-900 bg-amber-200/50 hover:bg-amber-200 p-2 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleSaveCake} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Reordered Fields based on prompt */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-stone-700 mb-1 flex items-center gap-2"><ImageIcon className="w-4 h-4"/> 1. Upload Image (URL)</label>
                  <input type="url" value={newCake.imageUrl} onChange={e => setNewCake({...newCake, imageUrl: e.target.value})} className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none" placeholder="https://..." />
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1 flex items-center gap-2"><Tag className="w-4 h-4"/> 2. Cake Name</label>
                  <input required type="text" value={newCake.name} onChange={e => setNewCake({...newCake, name: e.target.value})} className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none" placeholder="e.g. Chocolate Truffle" />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1 flex items-center gap-2"><Info className="w-4 h-4"/> 3. Cake Ingredients</label>
                  <input type="text" value={newCake.ingredients} onChange={e => setNewCake({...newCake, ingredients: e.target.value})} className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none" placeholder="e.g. Cocoa, Fresh Cream..." />
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1 flex items-center gap-2"><Tag className="w-4 h-4"/> 4. Occasional Cakes (Category)</label>
                  <input type="text" value={newCake.category} onChange={e => setNewCake({...newCake, category: e.target.value})} className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none" placeholder="e.g. Party Cake, Chocolate Cake" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1 flex items-center gap-2"><Weight className="w-4 h-4"/> 5. How many KGs?</label>
                  <input type="text" value={newCake.kgs} onChange={e => setNewCake({...newCake, kgs: e.target.value})} className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none" placeholder="e.g. 2kg to 5kg" />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-stone-700 mb-1 flex items-center gap-2"><IndianRupee className="w-4 h-4"/> 6. Price (₹)</label>
                  <input required type="number" min="1" value={newCake.price} onChange={e => setNewCake({...newCake, price: e.target.value})} className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none" placeholder="e.g. 450" />
                </div>

                <div className="md:col-span-2 pt-4 border-t border-stone-100 flex justify-end gap-3">
                  <button type="submit" className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-6 rounded-lg flex justify-center items-center gap-2 transition-colors shadow-md">
                    <Plus className="w-5 h-5" /> Put this cake in the home (Add to Menu)
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- WhatsApp Order Modal --- */}
      <AnimatePresence>
        {showOrderModal && selectedCake && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative overflow-hidden"
            >
              <div className="h-32 relative">
                <img src={selectedCake.imageUrl} alt={selectedCake.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-4">
                  <h3 className="text-xl font-bold text-white">{selectedCake.name}</h3>
                </div>
                <button 
                  onClick={() => setShowOrderModal(false)}
                  className="absolute top-4 right-4 text-white bg-black/40 hover:bg-black/60 p-1.5 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleOrderSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Your Name</label>
                  <input required type="text" value={orderForm.name} onChange={e => setOrderForm({...orderForm, name: e.target.value})} className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none" placeholder="John Doe" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">Quantity</label>
                    <input required type="number" min="1" value={orderForm.quantity} onChange={e => setOrderForm({...orderForm, quantity: parseInt(e.target.value)})} className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">Total Price</label>
                    <div className="w-full px-4 py-2 bg-stone-100 border border-stone-200 rounded-lg text-stone-700 font-bold">
                      ₹{selectedCake.price * orderForm.quantity}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">Pickup Date</label>
                    <input required type="date" value={orderForm.date} onChange={e => setOrderForm({...orderForm, date: e.target.value})} className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">Pickup Time</label>
                    <input required type="time" value={orderForm.time} onChange={e => setOrderForm({...orderForm, time: e.target.value})} className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Special Instructions (Optional)</label>
                  <textarea value={orderForm.specialInstructions} onChange={e => setOrderForm({...orderForm, specialInstructions: e.target.value})} className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none resize-none" rows={2} placeholder="E.g. Write 'Happy Birthday' on the cake" />
                </div>
                <div className="pt-2">
                  <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg flex justify-center items-center gap-2 transition-colors shadow-md">
                    <Phone className="w-5 h-5" /> Send Order via WhatsApp
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- Delete Confirmation Modal --- */}
      <AnimatePresence>
        {cakeToDelete && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-sm relative p-6 text-center"
            >
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-stone-900 mb-2">Delete Product</h3>
              <p className="text-stone-500 mb-6">Are you sure you want to remove this item? This action cannot be undone.</p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setCakeToDelete(null)}
                  className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold py-2 px-4 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDeleteCake}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- Toast Notification --- */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-4 right-4 z-50 px-6 py-3 rounded-lg shadow-xl text-white font-medium flex items-center gap-2 ${
              toastMessage.type === 'success' ? 'bg-green-600' : 
              toastMessage.type === 'error' ? 'bg-red-600' : 'bg-amber-600'
            }`}
          >
            {toastMessage.type === 'success' && <Info className="w-5 h-5" />}
            {toastMessage.type === 'error' && <X className="w-5 h-5" />}
            {toastMessage.title}
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
