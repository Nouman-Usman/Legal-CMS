'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, MapPin, Star, Phone, Mail, ArrowRight, Filter, Grid3x3, List, CheckCircle2 } from 'lucide-react';

interface Lawyer {
  id: number;
  name: string;
  title: string;
  location: string;
  specialties: string[];
  experience: number;
  rating: number;
  reviews: number;
  image?: string;
  bio: string;
  hourlyRate?: number;
  isAvailable: boolean;
}

const mockLawyers: Lawyer[] = [
  {
    id: 1,
    name: 'David Martinez',
    title: 'Senior Criminal Attorney',
    location: 'New York, NY',
    specialties: ['Criminal Law', 'DUI Defense', 'White Collar Crime'],
    experience: 15,
    rating: 4.9,
    reviews: 128,
    bio: 'Specializes in criminal defense with a proven track record of successful case outcomes.',
    hourlyRate: 350,
    isAvailable: true,
  },
  {
    id: 2,
    name: 'Sarah Chen',
    title: 'Family Law Specialist',
    location: 'Los Angeles, CA',
    specialties: ['Family Law', 'Divorce', 'Custody Cases'],
    experience: 12,
    rating: 4.8,
    reviews: 94,
    bio: 'Dedicated to protecting families and securing the best outcomes in family law matters.',
    hourlyRate: 280,
    isAvailable: true,
  },
  {
    id: 3,
    name: 'James Thompson',
    title: 'Corporate Legal Advisor',
    location: 'Chicago, IL',
    specialties: ['Corporate Law', 'M&A', 'Business Formation'],
    experience: 18,
    rating: 4.7,
    reviews: 156,
    bio: 'Expert in corporate restructuring and mergers with multinational experience.',
    hourlyRate: 400,
    isAvailable: true,
  },
  {
    id: 4,
    name: 'Maria Rodriguez',
    title: 'Immigration Law Expert',
    location: 'Miami, FL',
    specialties: ['Immigration', 'Visa Processing', 'Deportation Defense'],
    experience: 14,
    rating: 4.9,
    reviews: 203,
    bio: 'Compassionate advocate for immigration matters with bilingual expertise.',
    hourlyRate: 320,
    isAvailable: true,
  },
  {
    id: 5,
    name: 'Robert Johnson',
    title: 'Personal Injury Lawyer',
    location: 'Houston, TX',
    specialties: ['Personal Injury', 'Car Accidents', 'Medical Malpractice'],
    experience: 11,
    rating: 4.6,
    reviews: 87,
    bio: 'Fighting for maximum compensation for injury victims and their families.',
    hourlyRate: 290,
    isAvailable: true,
  },
  {
    id: 6,
    name: 'Emily Watson',
    title: 'Real Estate Attorney',
    location: 'Seattle, WA',
    specialties: ['Real Estate', 'Property Law', 'Contracts'],
    experience: 10,
    rating: 4.8,
    reviews: 76,
    bio: 'Specialist in complex real estate transactions and property disputes.',
    hourlyRate: 310,
    isAvailable: false,
  },
];

const practiceAreas = [
  'Criminal Law',
  'Family Law',
  'Corporate Law',
  'Immigration',
  'Personal Injury',
  'Real Estate',
  'Divorce',
  'DUI Defense',
  'Business Formation',
  'Medical Malpractice',
  'Custody Cases',
  'M&A',
];

const locations = [
  'New York, NY',
  'Los Angeles, CA',
  'Chicago, IL',
  'Miami, FL',
  'Houston, TX',
  'Seattle, WA',
];

export default function FindLawyersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [minRating, setMinRating] = useState(0);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filteredLawyers = mockLawyers.filter((lawyer) => {
    const matchesSearch = lawyer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lawyer.specialties.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesLocation = !selectedLocation || lawyer.location === selectedLocation;
    const matchesSpecialties = selectedSpecialties.length === 0 || 
      selectedSpecialties.some(spec => lawyer.specialties.includes(spec));
    const matchesRating = lawyer.rating >= minRating;

    return matchesSearch && matchesLocation && matchesSpecialties && matchesRating;
  });

  const toggleSpecialty = (specialty: string) => {
    setSelectedSpecialties(prev =>
      prev.includes(specialty)
        ? prev.filter(s => s !== specialty)
        : [...prev, specialty]
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-50/50 dark:from-slate-950 dark:to-slate-950/50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-800 dark:to-blue-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-8">
          <h1 className="text-4xl font-bold mb-4">Find Your Lawyer</h1>
          <p className="text-blue-100 text-lg">Connect with experienced legal professionals in your area</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* Search Bar */}
              <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <CardContent className="pt-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <Input
                      placeholder="Search lawyers..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Location Filter */}
              <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2 text-slate-900 dark:text-white">
                    <MapPin className="w-4 h-4" />
                    Location
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <button
                    onClick={() => setSelectedLocation('')}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      !selectedLocation
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    All Locations
                  </button>
                  {locations.map((location) => (
                    <button
                      key={location}
                      onClick={() => setSelectedLocation(location)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm ${
                        selectedLocation === location
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {location}
                    </button>
                  ))}
                </CardContent>
              </Card>

              {/* Practice Area Filter */}
              <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2 text-slate-900 dark:text-white">
                    <Filter className="w-4 h-4" />
                    Practice Area
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {practiceAreas.map((area) => (
                    <label
                      key={area}
                      className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedSpecialties.includes(area)}
                        onChange={() => toggleSpecialty(area)}
                        className="w-4 h-4 rounded border-slate-300 dark:border-slate-600"
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300">{area}</span>
                    </label>
                  ))}
                </CardContent>
              </Card>

              {/* Rating Filter */}
              <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2 text-slate-900 dark:text-white">
                    <Star className="w-4 h-4" />
                    Minimum Rating
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[0, 4, 4.5, 4.7, 4.9].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => setMinRating(rating)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm ${
                        minRating === rating
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {rating === 0 ? 'All Ratings' : `${rating}+ ⭐`}
                    </button>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Results Section */}
          <div className="lg:col-span-3 space-y-6">
            {/* Results Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {filteredLawyers.length} Lawyer{filteredLawyers.length !== 1 ? 's' : ''} Found
                </h2>
                <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
                  {selectedLocation && `in ${selectedLocation}`}
                  {selectedSpecialties.length > 0 && ` • ${selectedSpecialties.join(', ')}`}
                </p>
              </div>

              {/* View Toggle */}
              <div className="flex gap-2 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title="Grid View"
                >
                  <Grid3x3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded transition-colors ${
                    viewMode === 'list'
                      ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title="List View"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Lawyers Grid/List */}
            {filteredLawyers.length === 0 ? (
              <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <CardContent className="pt-12 pb-12 text-center">
                  <p className="text-slate-600 dark:text-slate-400 font-medium mb-2">No lawyers found</p>
                  <p className="text-sm text-slate-500 dark:text-slate-500">Try adjusting your filters</p>
                </CardContent>
              </Card>
            ) : (
              <div
                className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 md:grid-cols-2 gap-6'
                    : 'space-y-4'
                }
              >
                {filteredLawyers.map((lawyer) => (
                  <Card
                    key={lawyer.id}
                    className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-lg transition-shadow overflow-hidden"
                  >
                    <CardContent className="p-6">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-slate-900 dark:text-white">{lawyer.name}</h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400">{lawyer.title}</p>
                        </div>
                        {lawyer.isAvailable && (
                          <Badge className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Available
                          </Badge>
                        )}
                      </div>

                      {/* Location & Rating */}
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                          <MapPin className="w-4 h-4" />
                          {lawyer.location}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < Math.floor(lawyer.rating)
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'text-slate-300 dark:text-slate-600'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm font-semibold text-slate-900 dark:text-white">
                            {lawyer.rating}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            ({lawyer.reviews} reviews)
                          </span>
                        </div>
                      </div>

                      {/* Bio */}
                      <p className="text-sm text-slate-700 dark:text-slate-300 mb-4 line-clamp-2">
                        {lawyer.bio}
                      </p>

                      {/* Specialties */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {lawyer.specialties.slice(0, 3).map((specialty) => (
                          <Badge
                            key={specialty}
                            variant="outline"
                            className="text-xs border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                          >
                            {specialty}
                          </Badge>
                        ))}
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
                        <div>
                          <p className="text-xs text-slate-600 dark:text-slate-400">Experience</p>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">{lawyer.experience} years</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-600 dark:text-slate-400">Rate</p>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">${lawyer.hourlyRate}/hr</p>
                        </div>
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 ml-auto">
                          Contact
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
