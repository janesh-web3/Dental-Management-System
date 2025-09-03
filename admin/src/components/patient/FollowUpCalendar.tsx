import React, { useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Clock, User, Phone, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addMonths, subMonths, eachDayOfInterval, isSameDay, isSameMonth, isToday } from 'date-fns';

interface FollowUpItem {
  _id: string;
  date: string;
  type: string;
  reason?: string;
  completed: boolean;
  patientId: string;
  patientName: string;
  patientContact?: string;
  patientAge?: string;
  patientGender?: string;
  treatmentPlanId: string;
}

interface FollowUpCalendarProps {
  followUps: FollowUpItem[];
  onRefresh?: () => void;
  className?: string;
}

const FollowUpCalendar: React.FC<FollowUpCalendarProps> = ({
  followUps,
  onRefresh,
  className = ""
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [filteredType, setFilteredType] = useState<string>("all");
  const [showCompleted, setShowCompleted] = useState(false);

  const followUpTypes = [
    "Treatment Review",
    "Orthodontic Check", 
    "Pain Assessment",
    "Routine Check",
    "Post-Surgery",
    "Cleaning",
    "X-Ray Review",
    "Other"
  ];

  // Filter follow-ups based on current filters
  const filteredFollowUps = followUps.filter(fu => {
    if (filteredType !== "all" && fu.type !== filteredType) return false;
    if (!showCompleted && fu.completed) return false;
    return true;
  });

  // Get follow-ups for a specific day
  const getFollowUpsForDay = (date: Date) => {
    return filteredFollowUps.filter(fu => 
      isSameDay(new Date(fu.date), date)
    );
  };

  // Navigate months
  const previousMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  // Generate calendar days
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getTypeColor = (type: string) => {
    const colors = {
      "Treatment Review": "bg-blue-100 text-blue-700 border-blue-200",
      "Orthodontic Check": "bg-purple-100 text-purple-700 border-purple-200", 
      "Pain Assessment": "bg-red-100 text-red-700 border-red-200",
      "Routine Check": "bg-green-100 text-green-700 border-green-200",
      "Post-Surgery": "bg-orange-100 text-orange-700 border-orange-200",
      "Cleaning": "bg-cyan-100 text-cyan-700 border-cyan-200",
      "X-Ray Review": "bg-gray-100 text-gray-700 border-gray-200",
      "Other": "bg-yellow-100 text-yellow-700 border-yellow-200"
    };
    return colors[type as keyof typeof colors] || "bg-gray-100 text-gray-700 border-gray-200";
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header with Controls */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Follow-up Calendar
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                disabled={!onRefresh}
              >
                Refresh
              </Button>
            </div>
          </div>
          
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              <span className="text-sm font-medium">Filters:</span>
            </div>
            
            <Select value={filteredType} onValueChange={setFilteredType}>
              <SelectTrigger className="w-40 h-8">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {followUpTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant={showCompleted ? "default" : "outline"}
              size="sm"
              onClick={() => setShowCompleted(!showCompleted)}
              className="h-8"
            >
              {showCompleted ? "Hide" : "Show"} Completed
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {/* Calendar Navigation */}
          <div className="flex items-center justify-between mb-4">
            <Button variant="outline" size="sm" onClick={previousMonth}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <h3 className="text-lg font-semibold">
              {format(currentDate, 'MMMM yyyy')}
            </h3>
            <Button variant="outline" size="sm" onClick={nextMonth}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map(day => {
              const dayFollowUps = getFollowUpsForDay(day);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isTodayDate = isToday(day);
              
              return (
                <div
                  key={day.toISOString()}
                  className={`
                    min-h-[80px] p-1 border border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors
                    ${isCurrentMonth ? 'bg-white' : 'bg-gray-50 text-gray-400'}
                    ${isTodayDate ? 'bg-blue-50 border-blue-200' : ''}
                  `}
                  onClick={() => setSelectedDay(day)}
                >
                  <div className={`
                    text-sm font-medium mb-1
                    ${isTodayDate ? 'text-blue-600' : ''}
                  `}>
                    {format(day, 'd')}
                  </div>
                  
                  <div className="space-y-1">
                    {dayFollowUps.slice(0, 2).map(fu => (
                      <div
                        key={fu._id}
                        className={`
                          text-xs p-1 rounded border text-center truncate
                          ${getTypeColor(fu.type)}
                          ${fu.completed ? 'opacity-60 line-through' : ''}
                        `}
                        title={`${fu.patientName} - ${fu.type}${fu.reason ? ': ' + fu.reason : ''}`}
                      >
                        {fu.patientName.split(' ')[0]}
                      </div>
                    ))}
                    {dayFollowUps.length > 2 && (
                      <div className="text-xs text-center text-muted-foreground">
                        +{dayFollowUps.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Day Details Dialog */}
      <Dialog open={!!selectedDay} onOpenChange={() => setSelectedDay(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Follow-ups for {selectedDay && format(selectedDay, 'PPP')}
            </DialogTitle>
          </DialogHeader>
          
          {selectedDay && (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {getFollowUpsForDay(selectedDay).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No follow-ups scheduled</p>
                </div>
              ) : (
                getFollowUpsForDay(selectedDay).map(fu => (
                  <Card key={fu._id} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge className={getTypeColor(fu.type)}>
                              {fu.type}
                            </Badge>
                            {fu.completed && (
                              <Badge variant="outline" className="bg-green-50 text-green-700">
                                Completed
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-1 text-sm">
                            <User className="w-4 h-4" />
                            <span className="font-medium">{fu.patientName}</span>
                            {fu.patientAge && (
                              <span className="text-muted-foreground">({fu.patientAge})</span>
                            )}
                          </div>

                          {fu.patientContact && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Phone className="w-4 h-4" />
                              {fu.patientContact}
                            </div>
                          )}

                          {fu.reason && (
                            <p className="text-sm text-muted-foreground">{fu.reason}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {format(new Date(fu.date), 'MMM dd')}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FollowUpCalendar;
