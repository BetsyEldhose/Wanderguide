import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const CalendarView = ({ events, onDateSelect, isMinimized, toggleMinimize }) => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    let days = [];

    for (let i = 0; i < firstDay; i++) days.push({ empty: true });
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      const hasEvents = events.some(
        (event) => new Date(event.date).toDateString() === date.toDateString()
      );
      days.push({ date, dayNumber: i, hasEvents });
    }

    // Pad the array to ensure it’s a multiple of 7 (full rows)
    const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;
    for (let i = firstDay + daysInMonth; i < totalCells; i++) {
      days.push({ empty: true });
    }

    return days;
  };

  const handleDatePress = (day) => {
    if (!day.empty) {
      setSelectedDate(day.date);
      onDateSelect(day.date);
    }
  };

  const changeMonth = (increment) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + increment);
    setCurrentMonth(newMonth);
  };

  if (isMinimized) {
    return (
      <TouchableOpacity style={styles.minimizedCalendar} onPress={toggleMinimize}>
        <Text style={styles.minimizedCalendarText}>📅 View Calendar</Text>
      </TouchableOpacity>
    );
  }

  return (
    <ScrollView  bounces='false'style={styles.calendarContainer}>
      <View style={styles.calendarHeader}>
        <TouchableOpacity onPress={() => changeMonth(-1)}>
          <Text style={styles.calendarNavButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.calendarMonthText}>
          {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </Text>
        <TouchableOpacity onPress={() => changeMonth(1)}>
          <Text style={styles.calendarNavButton}>→</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={toggleMinimize}>
          <Text style={styles.calendarNavButton}>⬆</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.weekDaysRow}>
        {daysOfWeek.map((day) => (
          <Text key={day} style={styles.weekDayText}>
            {day}
          </Text>
        ))}
      </View>

      <View style={styles.daysGrid}>
        {getDaysInMonth().map((day, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.dayCell,
              day.empty && styles.emptyCell,
              selectedDate &&
                day.date &&
                selectedDate.toDateString() === day.date.toDateString() &&
                styles.selectedDay,
            ]}
            onPress={() => handleDatePress(day)}
            disabled={day.empty}
          >
            <Text
              style={[
                styles.dayText,
                selectedDate &&
                  day.date &&
                  selectedDate.toDateString() === day.date.toDateString() &&
                  styles.selectedDayText,
              ]}
            >
              {day.dayNumber}
            </Text>
            {day.hasEvents && <View style={styles.eventIndicator} />}
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  calendarContainer: {
    backgroundColor: '#000',
    margin: 15,
    borderRadius: 20,
    paddingTop: 3, // Maintains space for header
    paddingBottom: 2, // Reduced from 5 to 2 to minimize bottom space
    paddingHorizontal: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    borderColor: '#fff',
    borderWidth: 0.5,
    flex:1,
    flexGrow:1,
    
  },
  minimizedCalendar: {
    backgroundColor: '#000',
    margin: 15,
    borderRadius: 20,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    alignItems: 'center',
    borderColor: '#fff',
    borderWidth: 0.5,
  },
  minimizedCalendarText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  calendarNavButton: {
    fontSize: 24,
    color: '#fff',
    padding: 4,
  },
  calendarMonthText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  weekDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 0,
  },
  weekDayText: {
    width: 19,
    textAlign: 'center',
    fontSize: 10,
    color: '#fff',
    fontWeight: '500',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%', // 100% / 7 = 14.28% for exactly 7 cells per row
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 1, // Reduced from 1 to 0 to eliminate extra row spacing
  },
  dayText: {
    fontSize: 10,
    color: '#fff',
  },
  emptyCell: {
    backgroundColor: 'transparent',
  },
  selectedDay: {
    backgroundColor: '#000',
    borderRadius: 20,
    borderColor: '#fff',
    borderWidth: 0.5,
  },
  selectedDayText: {
    color: '#FFF',
    fontWeight: '600',
  },
  eventIndicator: {
    width: 5,
    height: 5,
    borderRadius: 2,
    backgroundColor: 'red',
    position: 'absolute',
    bottom: 0,
  },
});

export default React.memo(CalendarView);