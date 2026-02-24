import { motion, AnimatePresence } from 'framer-motion';
import { Quote, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../../../lib/utils';

interface Testimonial {
    id: string;
    name: string;
    role: string;
    company: string;
    avatar?: string;
    content: string;
    rating: number;
    completedModules: number;
    timeInAcademy: string;
}

interface TestimonialsSectionProps {
    testimonials: Testimonial[];
}

const TestimonialsSection = ({ testimonials }: TestimonialsSectionProps) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    const nextTestimonial = () => {
        setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    };

    const prevTestimonial = () => {
        setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
    };

    const currentTestimonial = testimonials[currentIndex];

    if (testimonials.length === 0) {
        return null;
    }

    return (
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
                <div>
                    <h3 className="text-sm font-bold text-white mb-0.5">
                        Graduados
                    </h3>
                    <p className="text-[10px] text-blue-100">
                        {testimonials.length} testimonios verificados
                    </p>
                </div>
                <div className="hidden sm:flex items-center gap-1.5">
                    <button
                        onClick={prevTestimonial}
                        className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                        aria-label="Testimonio anterior"
                    >
                        <ChevronLeft className="w-4 h-4 text-white" />
                    </button>
                    <button
                        onClick={nextTestimonial}
                        className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                        aria-label="Siguiente testimonio"
                    >
                        <ChevronRight className="w-4 h-4 text-white" />
                    </button>
                </div>
            </div>

            <div className="relative">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentIndex}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                        className="bg-white/10 backdrop-blur-sm rounded-lg p-3"
                    >
                        <Quote className="w-6 h-6 text-blue-200 mb-2" />

                        <p className="text-sm lg:text-base leading-relaxed mb-3 text-blue-50">
                            &quot;{currentTestimonial.content}&quot;
                        </p>

                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-sm font-bold text-white shadow-sm">
                                    {currentTestimonial.name.charAt(0)}
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-white mb-0.5">
                                        {currentTestimonial.name}
                                    </h4>
                                    <p className="text-[10px] text-blue-200 mb-1">
                                        {currentTestimonial.role} en {currentTestimonial.company}
                                    </p>
                                    <div className="flex items-center gap-0.5">
                                        {Array.from({ length: 5 }).map((_, i) => (
                                            <Star
                                                key={i}
                                                className={cn(
                                                    "w-3 h-3",
                                                    i < currentTestimonial.rating
                                                        ? 'fill-amber-400 text-amber-400'
                                                        : 'text-blue-300'
                                                )}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="hidden sm:block text-right">
                                <div className="bg-white/10 rounded-lg px-2.5 py-2 mb-1.5">
                                    <p className="text-[10px] text-blue-200 mb-0.5">Módulos</p>
                                    <p className="text-sm font-bold text-white">{currentTestimonial.completedModules}</p>
                                </div>
                                <div className="bg-white/10 rounded-lg px-2.5 py-2">
                                    <p className="text-[10px] text-blue-200 mb-0.5">Tiempo</p>
                                    <p className="text-sm font-bold text-white">{currentTestimonial.timeInAcademy}</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>

                {/* Mobile Navigation */}
                <div className="flex sm:hidden items-center justify-center gap-1.5 mt-3">
                    <button
                        onClick={prevTestimonial}
                        className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                        aria-label="Testimonio anterior"
                    >
                        <ChevronLeft className="w-4 h-4 text-white" />
                    </button>
                    <div className="flex items-center gap-0.5">
                        {testimonials.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentIndex(index)}
                                className={cn(
                                    "w-1.5 h-1.5 rounded-full transition-all",
                                    index === currentIndex
                                        ? 'bg-white w-4'
                                        : 'bg-white/50'
                                )}
                                aria-label={`Ir al testimonio ${index + 1}`}
                            />
                        ))}
                    </div>
                    <button
                        onClick={nextTestimonial}
                        className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                        aria-label="Siguiente testimonio"
                    >
                        <ChevronRight className="w-4 h-4 text-white" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TestimonialsSection;