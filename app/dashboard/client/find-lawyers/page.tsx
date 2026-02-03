'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { ProtectedRoute } from '@/lib/components/protected-route';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, MapPin, Star, Phone, Mail, ArrowRight, Filter, Grid3x3, List, CheckCircle2, Loader2 } from 'lucide-react';

interface Lawyer {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  bar_number?: string;
  status: string;
  lawyer_profile?: {
    licenseNumber: string;
    practiceAreas: string[];
    tagline: string;
    location?: string;
    bio?: string;
    yearsOfExperience?: number;
  };
}

export default function FindLawyersPage() {
  const [lawyers, setLawyers] = useState<Lawyer[]>([]);
  const [practiceAreas, setPracticeAreas] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [minRating, setMinRating] = useState(0);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Fetch lawyers from database
  useEffect(() => {
    const fetchLawyers = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('users')
          .select('id, full_name, avatar_url, bar_number, status, lawyer_profile')
          .eq('role', 'lawyer')
          .eq('status', 'active')
          .eq('onboarding_completed', true);

        if (error) throw error;

        const typedLawyers = (data || []) as Lawyer[];
        setLawyers(typedLawyers);

        // Extract and deduplicate practice areas from all lawyers
        const areas = Array.from(
          new Set(
            typedLawyers.flatMap(lawyer => lawyer.lawyer_profile?.practiceAreas || [])
          )
        ).sort((a, b) => a.localeCompare(b));
        setPracticeAreas(areas);

        // Extract and deduplicate locations from lawyer_profile
        const uniqueLocations = Array.from(
          new Set(
            typedLawyers
              .map(lawyer => lawyer.lawyer_profile?.location)
              .filter(Boolean) as string[]
          )
        ).sort((a, b) => a.localeCompare(b));
        setLocations(uniqueLocations.length > 0 ? uniqueLocations : []);
      } catch (error) {
        console.error('Error fetching lawyers:', error);
        setLawyers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLawyers();
  }, []);

  // Filter lawyers based on search and selected filters
  const filteredLawyers = lawyers.filter((lawyer) => {
    const practiceAreasFromProfile = lawyer.lawyer_profile?.practiceAreas || [];
    const tagline = lawyer.lawyer_profile?.tagline || '';
    const bio = lawyer.lawyer_profile?.bio || '';
    const lawyerLocation = lawyer.lawyer_profile?.location || '';

    const matchesSearch = 
      lawyer.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bio.toLowerCase().includes(searchQuery.toLowerCase()) ||
      practiceAreasFromProfile.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));

    // Filter by location - exact match with selected location
    const matchesLocation = !selectedLocation || lawyerLocation === selectedLocation;

    const matchesSpecialties = selectedSpecialties.length === 0 || 
      selectedSpecialties.some(spec => practiceAreasFromProfile.includes(spec));

    return matchesSearch && matchesLocation && matchesSpecialties;
  });

  const toggleSpecialty = (specialty: string) => {
    setSelectedSpecialties(prev =>
      prev.includes(specialty)
        ? prev.filter(s => s !== specialty)
        : [...prev, specialty]
    );
  };

  const getLawyerYearsOfExperience = (lawyer: Lawyer) => {
    return lawyer.lawyer_profile?.yearsOfExperience || 0;
  };

  const generateRating = (lawyer: Lawyer) => {
    // Generate a rating based on experience (simplified for now)
    const years = getLawyerYearsOfExperience(lawyer);
    const baseRating = 4.0 + (Math.min(years, 15) / 30);
    return Math.min(baseRating, 4.9);
  };

  const getRandomReviews = (lawyer: Lawyer) => {
    // Generate consistent review count based on lawyer ID
    const seed = lawyer.id.charCodeAt(0);
    return 50 + (seed % 150);
  };

  return (
    <ProtectedRoute requiredRole="client">
      <div className="p-8 bg-gradient-to-b from-slate-50 to-slate-50/50 dark:from-slate-950 dark:to-slate-950/50 min-h-screen">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white">Find Your Lawyer</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">Connect with experienced legal professionals</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Filters Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-8 space-y-6">
                {/* Search Bar */}
                <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
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
                <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2 text-slate-900 dark:text-white">
                      <MapPin className="w-4 h-4" />
                      Location
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <button
                      onClick={() => setSelectedLocation('')}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm ${
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
                <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
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
                <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
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
                    {loading ? 'Loading...' : `${filteredLawyers.length} Lawyer${filteredLawyers.length !== 1 ? 's' : ''} Found`}
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

              {/* Loading State */}
              {loading ? (
                <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <CardContent className="pt-12 pb-12 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-400" />
                  </CardContent>
                </Card>
              ) : /* Lawyers Grid/List */
              filteredLawyers.length === 0 ? (
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
                  {filteredLawyers.map((lawyer) => {
                    const rating = generateRating(lawyer);
                    const reviews = getRandomReviews(lawyer);
                    const practiceAreasFromProfile = lawyer.lawyer_profile?.practiceAreas || [];
                    const tagline = lawyer.lawyer_profile?.tagline || '';
                    const bio = lawyer.lawyer_profile?.bio || '';
                    const location = lawyer.lawyer_profile?.location || 'Location TBD';
                    const yearsOfExperience = getLawyerYearsOfExperience(lawyer);

                    return (
                      <Card
                        key={lawyer.id}
                        className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-lg transition-shadow overflow-hidden"
                      >
                        <CardContent className="p-6">
                          {/* Header */}
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{lawyer.full_name}</h3>
                              <p className="text-sm text-slate-600 dark:text-slate-400">{tagline}</p>
                            </div>
                            {lawyer.status === 'active' && (
                              <Badge className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                Active
                              </Badge>
                            )}
                          </div>

                          {/* Location, Rating & Contact */}
                          <div className="space-y-2 mb-4">
                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                              <MapPin className="w-4 h-4" />
                              {location}
                            </div>
                            {lawyer.phone && (
                              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                <Phone className="w-4 h-4" />
                                {lawyer.phone}
                              </div>
                            )}
                            {lawyer.email && (
                              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                <Mail className="w-4 h-4" />
                                {lawyer.email}
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <div className="flex items-center">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-4 h-4 ${
                                      i < Math.floor(rating)
                                        ? 'fill-amber-400 text-amber-400'
                                        : 'text-slate-300 dark:text-slate-600'
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-sm font-semibold text-slate-900 dark:text-white">
                                {rating.toFixed(1)}
                              </span>
                              <span className="text-xs text-slate-500 dark:text-slate-400">
                                ({reviews} reviews)
                              </span>
                            </div>
                          </div>

                          {/* Bio */}
                          <p className="text-sm text-slate-700 dark:text-slate-300 mb-4 line-clamp-2">
                            {bio}
                          </p>

                          {/* Practice Areas */}
                          <div className="flex flex-wrap gap-2 mb-4">
                            {practiceAreasFromProfile.slice(0, 3).map((specialty) => (
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
                              <p className="text-sm font-semibold text-slate-900 dark:text-white">{yearsOfExperience} years</p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-600 dark:text-slate-400">License</p>
                              <p className="text-sm font-semibold text-slate-900 dark:text-white">{lawyer.bar_number || 'N/A'}</p>
                            </div>
                            <Button className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 ml-auto">
                              Contact
                              <ArrowRight className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
