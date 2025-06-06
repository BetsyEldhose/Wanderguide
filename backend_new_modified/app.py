from flask import Flask, request, jsonify, session, flash, redirect, url_for,render_template
import requests
from config import Database
from datetime import datetime
import random
import os
from flask_cors import CORS
from datetime import datetime, timedelta
from indic_transliteration import sanscript
from indic_transliteration.sanscript import transliterate
import assemblyai as aai

app = Flask(__name__)
CORS(app) 

app.secret_key = 'your_secret_key'
# Initialize Database
db = Database()

#Guest Block

@app.route("/")
def home():
    return render_template("guest/index.html")

@app.route("/index")
def index():
    return render_template("guest/index.html")

@app.route("/logout")
def logout():
    # Clear the session data
    session.clear()
    flash("You have been logged out.", "info")
    return redirect(url_for('login'))



@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        username = request.form['username']
        password = request.form['password']

        if not username or not password:
            flash("Both username and password are required.", "danger")
            return redirect(url_for('login'))

        
        query = f"SELECT * FROM tbl_login WHERE username = '{username}' and password='{password}'"
        user = db.fetchone(query)

        if user:
            session['user_id'] = user['id']
            if user['type'] == 'admin':
                flash("Login successful! Welcome, Admin.", "success")
                return redirect(url_for('adminhome'))
            elif user['type'] == 'user':
                flash("Login successful! Welcome, Land Owner.", "success")
                return redirect(url_for('userhome'))
        else:
            flash("Invalid username or password. Please try again.", "danger")

    return render_template("guest/login.html")



#admin Block



@app.route("/admin-home")
def adminhome():
    try:
        # Total Users
        user_count_qry = "SELECT COUNT(*) as user_count FROM tbl_user"
        user_count = db.fetchone(user_count_qry)['user_count']

        # Total Bookings and Status Breakdown
        booking_count_qry = "SELECT COUNT(*) as booking_count FROM tbl_booking"
        booking_count = db.fetchone(booking_count_qry)['booking_count']
        booking_status_qry = """
            SELECT status, COUNT(*) as count 
            FROM tbl_booking 
            GROUP BY status
        """
        booking_status = db.fetchall(booking_status_qry)

        # Total Events
        event_count_qry = "SELECT COUNT(*) as event_count FROM tbl_event"
        event_count = db.fetchone(event_count_qry)['event_count']

        # Total Drivers
        driver_count_qry = "SELECT COUNT(*) as driver_count FROM tbl_driver"
        driver_count = db.fetchone(driver_count_qry)['driver_count']

        # Total Guides
        guide_count_qry = "SELECT COUNT(*) as guide_count FROM tbl_guide"
        guide_count = db.fetchone(guide_count_qry)['guide_count']

        # Total Hotels
        hotel_count_qry = "SELECT COUNT(*) as hotel_count FROM tbl_hotel"
        hotel_count = db.fetchone(hotel_count_qry)['hotel_count']

        # Total Spots
        spot_count_qry = "SELECT COUNT(*) as spot_count FROM tbl_spot"
        spot_count = db.fetchone(spot_count_qry)['spot_count']

        # Total Places
        place_count_qry = "SELECT COUNT(*) as place_count FROM tbl_place"
        place_count = db.fetchone(place_count_qry)['place_count']

        # Total Reviews and Rating Breakdown
        review_count_qry = "SELECT COUNT(*) as review_count FROM tbl_review"
        review_count = db.fetchone(review_count_qry)['review_count']
        review_rating_qry = """
            SELECT rating, COUNT(*) as count 
            FROM tbl_review 
            GROUP BY rating
        """
        review_ratings = db.fetchall(review_rating_qry)

        # Recent Activity (e.g., latest bookings or reviews)
        recent_bookings_qry = """
            SELECT b.id, u.name as user, p.place_name as start, p1.place_name as end, b.status ,d.name as driver
            FROM tbl_booking b 
            JOIN tbl_user u ON b.login_id = u.login_id 
            JOIN tbl_place p ON b.start_point = p.id 
            JOIN tbl_place p1 ON b.destination = p1.id 
            Join tbl_cab c on b.cab_id = c.id
            Join tbl_driver d on c.driver_id = d.login_id
            ORDER BY b.id DESC 
            LIMIT 5
        """
        recent_bookings = db.fetchall(recent_bookings_qry)

        # Notifications (e.g., recent reviews as feedback)
        recent_reviews_qry = """
            SELECT r.id, u.name, r.rating, r.comment, r.date ,place_name
            FROM tbl_review r 
            JOIN tbl_user u ON r.user_id = u.login_id 
            inner join tbl_place p on r.place_id=p.id
            ORDER BY r.date DESC 
            LIMIT 3
        """
        notifications = db.fetchall(recent_reviews_qry)

        return render_template(
            "admin/index.html",
            user_count=user_count,
            booking_count=booking_count,
            booking_status=booking_status,
            event_count=event_count,
            driver_count=driver_count,
            guide_count=guide_count,
            hotel_count=hotel_count,
            spot_count=spot_count,
            place_count=place_count,
            review_count=review_count,
            review_ratings=review_ratings,
            recent_bookings=recent_bookings,
            notifications=notifications
        )
    except Exception as e:
        flash(f"An error occurred: {str(e)}", "error")
        return render_template("admin/index.html")

@app.route("/admin-place", methods=['POST', 'GET'])
def adminplace():
    if request.method == "POST":
        place_id = request.form.get("place_id")  # Hidden field for edit mode
        place = request.form.get("place")
        lat = request.form.get("latitude")
        long = request.form.get("longitude")
        photos = request.files.getlist("photos")  # New photos to add
        delete_photos = request.form.getlist("delete_photos")  # IDs of photos to delete
        replace_photos = request.files.getlist("replace_photos") 
        popular=request.form.get("popular") # Replacement photos

        if not place or not lat or not long or not popular:
            flash("Place name, latitude, and longitude are required.", "error")
        else:
            try:
                if place_id:  # Edit mode
                    updateQry = f"UPDATE tbl_place SET place_name = '{place}', latitude = '{lat}', longitude = '{long}',popular='{popular}' WHERE id = {place_id}"
                    db.execute(updateQry)
                    flash("Place updated successfully!", "success")
                else:  # Add mode
                    insertQry = f"INSERT INTO tbl_place (place_name, latitude, longitude,popular) VALUES ('{place}', '{lat}', '{long}','{popular}')"
                    db.single_insert(insertQry)
                    place_id = db.cursor.lastrowid  # Get the newly inserted place ID
                    flash("Place added successfully!", "success")

                # Handle deletion of existing photos
                if delete_photos:
                    for photo_id in delete_photos:
                        deleteQry = f"DELETE FROM tbl_place_photo WHERE id = {photo_id} AND place_id = {place_id}"
                        db.execute(deleteQry)

                # Handle new photo uploads
                if photos:
                    for photo in photos:
                        if photo and photo.filename:
                            filename = photo.filename
                            photo_path = os.path.join("static/place_uploads", filename)
                            photo.save(photo_path)
                            photo_url = f'place_uploads/{filename}'
                            photoQry = f"INSERT INTO tbl_place_photo (place_photo, place_id) VALUES ('{photo_url}', {place_id})"
                            db.single_insert(photoQry)

                # Handle photo replacements
                if replace_photos:
                    replace_ids = request.form.getlist("replace_photo_ids")  # IDs of photos to replace
                    for i, photo in enumerate(replace_photos):
                        if photo and photo.filename and i < len(replace_ids):
                            # Delete old photo
                            deleteQry = f"DELETE FROM tbl_place_photo WHERE id = {replace_ids[i]} AND place_id = {place_id}"
                            db.execute(deleteQry)
                            # Add new photo
                            filename = photo.filename
                            photo_path = os.path.join("static/place_uploads", filename)
                            photo.save(photo_path)
                            photo_url = f'place_uploads/{filename}'
                            photoQry = f"INSERT INTO tbl_place_photo (place_photo, place_id) VALUES ('{photo_url}', {place_id})"
                            db.single_insert(photoQry)

            except Exception as e:
                flash(f"An error occurred: {str(e)}", "error")

    # Handle search query
    search_query = request.args.get("search", "").strip()
    if search_query:
        place_qry = f"SELECT * FROM tbl_place WHERE place_name LIKE '%{search_query}%'"
    else:
        place_qry = "SELECT * FROM tbl_place"
    places = db.fetchall(place_qry)
    
    # Fetch photos for each place
    place_photos = {}
    for place in places:
        photo_qry = f"SELECT * FROM tbl_place_photo WHERE place_id = {place['id']}"
        place_photos[place['id']] = db.fetchall(photo_qry)

    return render_template("admin/place.html", places=places, place_photos=place_photos, search_query=search_query)

@app.route("/admin-place/<int:place_id>", methods=['GET'])
def edit_place(place_id):
    # Fetch the place data by ID
    place_qry = f"SELECT * FROM tbl_place WHERE id = {place_id}"
    place = db.fetchone(place_qry)
    if not place:
        flash("Place not found.", "error")
        return redirect(url_for('adminplace'))

    # Fetch all places for the table
    places_qry = "SELECT * FROM tbl_place"
    places = db.fetchall(places_qry)

    # Fetch photos for the place being edited
    photo_qry = f"SELECT * FROM tbl_place_photo WHERE place_id = {place['id']}"
    photos = db.fetchall(photo_qry)

    # Fetch photos for all places (for the table)
    place_photos = {}
    for p in places:
        photo_qry = f"SELECT * FROM tbl_place_photo WHERE place_id = {p['id']}"
        place_photos[p['id']] = db.fetchall(photo_qry)

    return render_template("admin/place.html", places=places, place_to_edit=place, photos=photos, place_photos=place_photos)

@app.route("/admin-event", methods=['POST', 'GET'])
def adminevent():
    if request.method == "POST":
        event_id = request.form.get("event_id")  # Hidden field for edit mode
        title = request.form.get("title")
        details = request.form.get("details")
        time = request.form.get("time")
        date = request.form.get("date")
        location_id = request.form.get("place")

        if not title or not details  or not date or not location_id:
            flash("All fields are required.", "error")
        else:
            try:
                if event_id:  # Edit mode
                    updateQry = f"UPDATE tbl_event SET title = '{title}', details = '{details}', time = '{time}', date = '{date}', location_id = '{location_id}' WHERE id = {event_id}"
                    db.execute(updateQry)
                    flash("Event updated successfully!", "success")
                else:  # Add mode
                    insertQry = f"INSERT INTO tbl_event (title, details, time, date, location_id) VALUES ('{title}', '{details}', '{time}', '{date}', '{location_id}')"
                    db.single_insert(insertQry)
                    flash("Event added successfully!", "success")
            except Exception as e:
                flash(f"An error occurred: {str(e)}", "error")

    # Fetch all events with place names
    event_qry = "SELECT e.*, p.place_name FROM tbl_event e INNER JOIN tbl_place p ON p.id = e.location_id"
    events = db.fetchall(event_qry)

    # Fetch all places for the dropdown
    places_qry = "SELECT * FROM tbl_place"
    places = db.fetchall(places_qry)

    return render_template("admin/event.html", events=events, places=places)

@app.route("/admin-event/<int:event_id>", methods=['GET'])
def edit_event(event_id):
    # Fetch the event data by ID
    event_qry = f"SELECT e.*, p.place_name FROM tbl_event e INNER JOIN tbl_place p ON p.id = e.location_id WHERE e.id = {event_id}"
    event = db.fetchone(event_qry)
    if not event:
        flash("Event not found.", "error")
        return redirect(url_for('adminevent'))

    # Fetch all events with place names
    events_qry = "SELECT e.*, p.place_name FROM tbl_event e INNER JOIN tbl_place p ON p.id = e.location_id"
    events = db.fetchall(events_qry)

    # Fetch all places for the dropdown
    places_qry = "SELECT * FROM tbl_place"
    places = db.fetchall(places_qry)

    return render_template("admin/event.html", events=events, places=places, event_to_edit=event)

@app.route("/admin-event/<int:event_id>/delete", methods=['GET'])
def delete_event(event_id):
    try:
        # Delete the event by ID
        deleteQry = f"DELETE FROM tbl_event WHERE id = {event_id}"
        db.execute(deleteQry)
        flash("Event deleted successfully!", "success")
    except Exception as e:
        flash(f"An error occurred: {str(e)}", "error")
    
    return redirect(url_for('adminevent'))

@app.route('/admin-driver', methods=['POST', 'GET'])
def adddriver():
    if request.method == "POST":
        driver_id = request.form.get("driver_id")  # Hidden field for edit mode
        name = request.form.get("name")
        age = request.form.get("age")
        gender = request.form.get("gender")
        contact = request.form.get("phone")
        license = request.form.get("license_no")
        cab = request.form.get("cab_no")

        if not name or not age or not gender or not contact or not license or not cab:
            flash("All fields are required.", "error")
        else:
            try:
                if driver_id:  # Edit mode
                    updateQry = f"UPDATE tbl_driver SET name = '{name}', age = '{age}', gender = '{gender}', phone = '{contact}', license_no = '{license}', cab_no = '{cab}' WHERE id = {driver_id}"
                    db.execute(updateQry)
                    flash("Driver updated successfully!", "success")
                else:  # Add mode
                    insertQry = f"INSERT INTO tbl_driver (name, age, gender, phone, license_no, cab_no) VALUES ('{name}', '{age}', '{gender}', '{contact}', '{license}', '{cab}')"
                    db.single_insert(insertQry)
                    flash("Driver added successfully!", "success")
            except Exception as e:
                flash(f"An error occurred: {str(e)}", "error")

    # Fetch all drivers
    driver_qry = "SELECT d.*, p.place_name FROM tbl_driver d inner join tbl_place p on d.location_id = p.id"
    drivers = db.fetchall(driver_qry)

    # Fetch all places for the dropdown (if needed)
    place_qry = "SELECT * FROM tbl_place"
    places = db.fetchall(place_qry)

    return render_template("admin/driver.html", drivers=drivers, places=places)

@app.route("/admin-driver/<int:driver_id>", methods=['GET'])
def edit_driver(driver_id):
    # Fetch the driver data by ID
    driver_qry = f"SELECT * FROM tbl_driver WHERE id = {driver_id}"
    driver = db.fetchone(driver_qry)
    if not driver:
        flash("Driver not found.", "error")
        return redirect(url_for('adddriver'))

    # Fetch all drivers for the table
    drivers_qry = "SELECT * FROM tbl_driver"
    drivers = db.fetchall(drivers_qry)

    # Fetch all places for the dropdown (if needed)
    place_qry = "SELECT * FROM tbl_place"
    places = db.fetchall(place_qry)

    return render_template("admin/driver.html", drivers=drivers, places=places, driver_to_edit=driver)

@app.route("/admin-driver/<int:driver_id>/delete", methods=['GET'])
def delete_driver(driver_id):
    try:
        # Delete the driver by ID
        deleteQry = f"DELETE FROM tbl_driver WHERE id = {driver_id}"
        db.execute(deleteQry)
        flash("Driver deleted successfully!", "success")
    except Exception as e:
        flash(f"An error occurred: {str(e)}", "error")
    
    return redirect(url_for('adddriver'))

@app.route('/admin-guide', methods=['POST', 'GET'])
def addguide():
    if request.method == "POST":
        guide_id = request.form.get("guide_id")  # Hidden field for edit mode
        name = request.form.get("name")
        age = request.form.get("age")
        place =request.form.get("place")
        gender = request.form.get("gender")
        contact = request.form.get("ph_no")
        email = request.form.get("email")
        status = request.form.get("status")

        if not name or not age or not gender or not contact or not email or not status:
            flash("All fields are required.", "error")
        else:
            try:
                if guide_id:  # Edit mode
                    updateQry = f"UPDATE tbl_guide SET name = '{name}', age = '{age}', gender = '{gender}', phone_no = '{contact}', email = '{email}', status = '{status}',location_id='{place}' WHERE id = {guide_id}"
                    db.execute(updateQry)
                    flash("Guide updated successfully!", "success")
                else:  # Add mode
                    insertQry = f"INSERT INTO tbl_guide (name, age, gender, phone_no, email, status,location_id) VALUES ('{name}', '{age}', '{gender}', '{contact}', '{email}', '{status}','{place}')"
                    db.single_insert(insertQry)
                    flash("Guide added successfully!", "success")
            except Exception as e:
                flash(f"An error occurred: {str(e)}", "error")

    # Fetch all guides
    guide_qry = "SELECT g.*,p.place_name FROM tbl_guide g inner join tbl_place p on g.location_id = p.id"
    guides = db.fetchall(guide_qry)

    # Fetch all places for the dropdown (if needed)
    place_qry = "SELECT * FROM tbl_place"
    places = db.fetchall(place_qry)

    return render_template("admin/guide.html", guides=guides, places=places)

@app.route("/admin-guide/<int:guide_id>", methods=['GET'])
def edit_guide(guide_id):
    # Fetch the guide data by ID
    guide_qry = f"SELECT * FROM tbl_guide WHERE id = {guide_id}"
    guide = db.fetchone(guide_qry)
    if not guide:
        flash("Guide not found.", "error")
        return redirect(url_for('addguide'))

    # Fetch all guides for the table
    guides_qry = "SELECT * FROM tbl_guide"
    guides = db.fetchall(guides_qry)

    # Fetch all places for the dropdown (if needed)
    place_qry = "SELECT * FROM tbl_place"
    places = db.fetchall(place_qry)

    return render_template("admin/guide.html", guides=guides, places=places, guide_to_edit=guide)

@app.route("/admin-guide/<int:guide_id>/delete", methods=['GET'])
def delete_guide(guide_id):
    try:
        # Delete the guide by ID
        deleteQry = f"DELETE FROM tbl_guide WHERE id = {guide_id}"
        db.execute(deleteQry)
        flash("Guide deleted successfully!", "success")
    except Exception as e:
        flash(f"An error occurred: {str(e)}", "error")
    
    return redirect(url_for('addguide'))



@app.route('/admin-hotels', methods=['POST', 'GET'])
def addhotel():
    if request.method == "POST":
        hotel_id = request.form.get("hotel_id")  # Hidden field for edit mode
        name = request.form.get("name")
        address = request.form.get("address")
        contact = request.form.get("ph_no")
        email = request.form.get("email")
        available_rooms = request.form.get("available_rooms")
        location_id = request.form.get("location")  # Updated to location_id
        image = request.files.get("image")
        image_1 = request.files.get("image_1")
        image_2 = request.files.get("image_2")
        image_3 = request.files.get("image_3")

        if not name or not address or not contact or not email or not available_rooms or not location_id:
            flash("All fields (except images) are required.", "error")
        else:
            # Handle image uploads
            image_urls = {}
            for img_key, img_file in [('image', image), ('image_1', image_1), ('image_2', image_2), ('image_3', image_3)]:
                if img_file and img_file.filename:
                    filename = img_file.filename
                    image_path = os.path.join("static/hotel_uploads", filename)
                    img_file.save(image_path)
                    image_urls[img_key] = f'hotel_uploads/{filename}'
                else:
                    image_urls[img_key] = None

            try:
                if hotel_id:  # Edit mode
                    update_fields = f"""
                        name = '{name}', 
                        address = '{address}', 
                        contact = '{contact}', 
                        email = '{email}',
                        available_rooms = '{available_rooms}',
                        location_id = '{location_id}'  # Updated to location_id
                    """
                    if image_urls['image']:
                        update_fields += f", image = '{image_urls['image']}'"
                    if image_urls['image_1']:
                        update_fields += f", image_1 = '{image_urls['image_1']}'"
                    if image_urls['image_2']:
                        update_fields += f", image_2 = '{image_urls['image_2']}'"
                    if image_urls['image_3']:
                        update_fields += f", image_3 = '{image_urls['image_3']}'"
                    
                    updateQry = f"UPDATE tbl_hotel SET {update_fields} WHERE id = {hotel_id}"
                    db.execute(updateQry)
                    flash("Hotel updated successfully!", "success")
                else:  # Add mode
                    insertQry = f"""
                        INSERT INTO tbl_hotel (name, address, contact, email, available_rooms, location_id, image, image_1, image_2, image_3) 
                        VALUES ('{name}', '{address}', '{contact}', '{email}', '{available_rooms}', '{location_id}',
                                '{image_urls['image'] or ''}', 
                                '{image_urls['image_1'] or ''}', 
                                '{image_urls['image_2'] or ''}', 
                                '{image_urls['image_3'] or ''}')
                    """
                    db.single_insert(insertQry)
                    flash("Hotel added successfully!", "success")
            except Exception as e:
                flash(f"An error occurred: {str(e)}", "error")

    # Fetch all hotels with location information
    hotel_qry = """
        SELECT h.*, p.place_name 
        FROM tbl_hotel h 
        LEFT JOIN tbl_place p ON h.location_id = p.id  -- Updated to location_id
    """
    hotels = db.fetchall(hotel_qry)
    for hotel in hotels:
        reviews = db.fetchall(f"SELECT * FROM tbl_hotel_review WHERE hotel_id = {hotel['id']}")
        hotel['reviews'] = reviews

    # Fetch all places for the dropdown
    place_qry = "SELECT * FROM tbl_place"
    places = db.fetchall(place_qry)

    return render_template("admin/hotel.html", hotels=hotels, places=places)

@app.route("/admin-hotels/<int:hotel_id>", methods=['GET'])
def edit_hotel(hotel_id):
    # Fetch the hotel data by ID with location information
    hotel_qry = f"""
        SELECT h.*, p.place_name 
        FROM tbl_hotel h 
        LEFT JOIN tbl_place p ON h.location_id = p.id  -- Updated to location_id
        WHERE h.id = {hotel_id}
    """
    hotel = db.fetchone(hotel_qry)
    if not hotel:
        flash("Hotel not found.", "error")
        return redirect(url_for('addhotel'))

    # Fetch all hotels for the table
    hotels_qry = """
        SELECT h.*, p.place_name 
        FROM tbl_hotel h 
        LEFT JOIN tbl_place p ON h.location_id = p.id  -- Updated to location_id
    """
    hotels = db.fetchall(hotels_qry)

    # Fetch all places for the dropdown
    place_qry = "SELECT * FROM tbl_place"
    places = db.fetchall(place_qry)

    return render_template("admin/hotel.html", hotels=hotels, places=places, hotel_to_edit=hotel)

@app.route("/admin-hotels/<int:hotel_id>/delete", methods=['GET'])
def delete_hotel(hotel_id):
    try:
        # Delete the hotel by ID
        deleteQry = f"DELETE FROM tbl_hotel WHERE id = {hotel_id}"
        db.execute(deleteQry)
        flash("Hotel deleted successfully!", "success")
    except Exception as e:
        flash(f"An error occurred: {str(e)}", "error")
    
    return redirect(url_for('addhotel'))
@app.route('/admin-hotels/<int:hotel_id>/delete-image', methods=['POST'])
def delete_hotel_image(hotel_id):
    image_field = request.form.get('image_field')  # e.g., 'image', 'image_1', 'image_2', 'image_3'
    
    if image_field not in ['image', 'image_1', 'image_2', 'image_3']:
        flash("Invalid image field.", "error")
        return redirect(url_for('edit_hotel', hotel_id=hotel_id))

    try:
        # Fetch the current image path to delete it from the filesystem
        hotel_qry = f"SELECT {image_field} FROM tbl_hotel WHERE id = {hotel_id}"
        hotel = db.fetchone(hotel_qry)
        
        if hotel and hotel[image_field]:
            image_path = os.path.join(app.root_path, 'static', hotel[image_field])
            if os.path.exists(image_path):
                os.remove(image_path)
            
            # Update the database to set the image field to NULL or empty string
            update_qry = f"UPDATE tbl_hotel SET {image_field} = NULL WHERE id = {hotel_id}"
            db.execute(update_qry)
            flash(f"{image_field.replace('_', ' ').title()} deleted successfully!", "success")
        else:
            flash("No image found to delete.", "warning")
            
    except Exception as e:
        flash(f"An error occurred: {str(e)}", "error")
    
    return redirect(url_for('edit_hotel', hotel_id=hotel_id))


# Modify the existing addspot() function to handle image updates better
@app.route('/admin-spot', methods=['POST', 'GET'])
def addspot():
    if request.method == "POST":
        spot_id = request.form.get("spot_id")
        name = request.form.get("name")
        details = request.form.get("details")
        place_id = request.form.get("place")
        image = request.files.get("image")

        if not name or not details or not place_id:
            flash("Name, Details, and Place are required.", "error")
        else:
            try:
                # Handle image upload
                image_path = None
                if image and image.filename:
                    filename = image.filename
                    image_path = os.path.join("static/spot_uploads", filename)
                    image.save(image_path)
                    image_path = f"spot_uploads/{filename}"

                if spot_id:  # Edit mode
                    # Fetch existing spot to potentially delete old image
                    existing_qry = f"SELECT image FROM tbl_spot WHERE id = {spot_id}"
                    existing_spot = db.fetchone(existing_qry)
                    
                    if image_path and existing_spot and existing_spot['image']:
                        old_image_path = os.path.join("static", existing_spot['image'])
                        if os.path.exists(old_image_path):
                            os.remove(old_image_path)
                    
                    if image_path:
                        updateQry = f"UPDATE tbl_spot SET name = '{name}', details = '{details}', place_id = '{place_id}', image = '{image_path}' WHERE id = {spot_id}"
                    else:
                        updateQry = f"UPDATE tbl_spot SET name = '{name}', details = '{details}', place_id = '{place_id}' WHERE id = {spot_id}"
                    db.execute(updateQry)
                    flash("Spot updated successfully!", "success")
                else:  # Add mode
                    if image_path:
                        insertQry = f"INSERT INTO tbl_spot (name, details, place_id, image) VALUES ('{name}', '{details}', '{place_id}', '{image_path}')"
                    else:
                        insertQry = f"INSERT INTO tbl_spot (name, details, place_id) VALUES ('{name}', '{details}', '{place_id}')"
                    db.single_insert(insertQry)
                    flash("Spot added successfully!", "success")
            except Exception as e:
                flash(f"An error occurred: {str(e)}", "error")

    spot_qry = "SELECT * FROM tbl_spot"
    spots = db.fetchall(spot_qry)
    place_qry = "SELECT * FROM tbl_place"
    places = db.fetchall(place_qry)

    return render_template("admin/spot.html", spots=spots, places=places)

@app.route("/admin-spot/<int:spot_id>", methods=['GET'])
def edit_spot(spot_id):
    # Fetch the spot data by ID
    spot_qry = f"SELECT * FROM tbl_spot WHERE id = {spot_id}"
    spot = db.fetchone(spot_qry)
    if not spot:
        flash("Spot not found.", "error")
        return redirect(url_for('addspot'))

    # Fetch all spots for the table
    spots_qry = "SELECT * FROM tbl_spot"
    spots = db.fetchall(spots_qry)

    # Fetch all places for the dropdown
    place_qry = "SELECT * FROM tbl_place"
    places = db.fetchall(place_qry)

    return render_template("admin/spot.html", spots=spots, places=places, spot_to_edit=spot)

@app.route("/admin-spot/<int:spot_id>/delete", methods=['GET'])
def delete_spot(spot_id):
    try:
        # Delete the spot by ID
        deleteQry = f"DELETE FROM tbl_spot WHERE id = {spot_id}"
        db.execute(deleteQry)
        flash("Spot deleted successfully!", "success")
    except Exception as e:
        flash(f"An error occurred: {str(e)}", "error")
    
    return redirect(url_for('addspot'))

@app.route("/admin-spot/<int:spot_id>/delete-image", methods=['GET'])
def delete_spot_image(spot_id):
    try:
        # Fetch the current spot to get the image path
        spot_qry = f"SELECT image FROM tbl_spot WHERE id = {spot_id}"
        spot = db.fetchone(spot_qry)
        
        if spot and spot['image']:
            # Delete the image file from the server
            image_path = os.path.join("static", spot['image'])
            if os.path.exists(image_path):
                os.remove(image_path)
            
            # Update the database to remove the image reference
            update_qry = f"UPDATE tbl_spot SET image = NULL WHERE id = {spot_id}"
            db.execute(update_qry)
            flash("Image deleted successfully!", "success")
        else:
            flash("No image found to delete.", "warning")
            
    except Exception as e:
        flash(f"An error occurred: {str(e)}", "error")
    
    return redirect(url_for('edit_spot', spot_id=spot_id))

@app.route('/admin-user', methods=['GET'])
def view_users():
    # Fetch all users
    user_qry = "SELECT id, name, age, phone, email, login_id FROM tbl_user"
    users = db.fetchall(user_qry)

    return render_template("admin/user.html", users=users)



@app.route('/admin-booking', methods=['GET'])
def fetch_admin_booking():
    try:    
        selQry = f"SELECT b.id as id,cab_details,d.name as driver_name,b.login_id,start_point,destination,b.status,u.name as user,p.place_name as start,p1.place_name as end FROM tbl_booking b join tbl_cab c on b.cab_id = c.id join tbl_driver d on c.driver_id = d.login_id join tbl_place p on b.start_point = p.id join tbl_place p1 on b.destination = p1.id join tbl_user u on b.login_id = u.login_id Order By b.id DESC"
        booking = db.fetchall(selQry)
        return render_template("admin/book.html", booking=booking)
    except Exception as e:
        flash(f"An error occurred: {str(e)}", "error")    
        return render_template("admin/book.html")
    
@app.route('/admin-review', methods=['GET'])
def fetch_admin_reviews():
    try:
        qry = "SELECT r.id, r.rating, r.comment, u.name, r.date,r.image_url,p.place_name FROM tbl_review r JOIN tbl_user u ON r.user_id = u.login_id join tbl_place p on p.id=r.place_id"
        reviews = db.fetchall(qry)
        print(reviews)
        return render_template("admin/review.html", reviews=reviews)
    except Exception as e:
        flash(f"An error occurred: {str(e)}", "error")
        return render_template("admin/review.html")



#API Block

# Login API - Exposed for React Native to call
@app.route("/api/login", methods=["POST"])
def API_login():
    # Extract credentials from the request body
    data = request.get_json()  # Expecting JSON payload with 'username' and 'password'
    username = data.get("username")
    password = data.get("password")

    # Validate input
    if not username or not password:
        return jsonify({"success": False, "message": "Both username and password are required."}), 400

    # Query the database for the user
    selQry = f"SELECT * FROM tbl_login WHERE username = '{username}' and password='{password}'"
    user = db.fetchone(selQry)

    if user:
        # Save user info in session (optional for later use in the app)
        session['user_id'] = user['id']
        userId=user['id']

        # Check user type and respond accordingly
        if user['type'] == 'Traveller':
            return jsonify({"success": True, "message": "Login successful! Welcome, Traveller.","userId":f'{userId}',"userType":user['type'],"name":user["username"]})
        if user['type'] == 'Driver':
            return jsonify({"success": True, "message": "Login successful! Welcome, Driver.","userId":f'{userId}',"userType":user['type'],"name":user["username"]})
        else:
            return jsonify({"success": False, "message": "Login failed! Admins are not allowed to access this API."})
    else:
        return jsonify({"success": False, "message": "Invalid username or password. Please try again."}), 401
    
    

# Register API - Exposed for React Native to call
@app.route("/api/register", methods=["POST"])
def API_register():
    # Extract data from the request body
    data = request.get_json()  # Expecting JSON payload with required fields
    print(data)
    username = data.get("username")
    password = data.get("password")
    usertype = data.get("role")  # 'traveller' or 'driver'
    name = data.get("name")
    age = data.get("age")
    phone = data.get("contact")
    
    if password!= data.get("confirmPassword"):
        return jsonify({"success": False, "message": "Passwords do not match."}), 400

    # Validate mandatory input
    if not all([username, password, usertype, name, age, phone]):
        return jsonify({"success": False, "message": "All fields are required."}), 400

    # Insert into tbl_login
    try:
        sel_user_qry = f"SELECT * FROM tbl_login WHERE username = '{username}'"
        user = db.fetchone(sel_user_qry)
        if user:
            return jsonify({"success": False, "message": "Username already exists. Please choose a different one."}), 400

        insLoginQry = f"INSERT INTO tbl_login (username, password, type) VALUES ('{username}', '{password}', '{usertype}')"
        login_id = db.executeAndReturnId(insLoginQry)  # Assuming db.insert returns the auto-incremented id

        if usertype == "Traveller":
            email = data.get("email")  # Additional field for travellers
            if not email:
                return jsonify({"success": False, "message": "Email is required for travellers."}), 400

            # Insert into tbl_user
            insUserQry = f"""
                INSERT INTO tbl_user (name, age, email, phone, login_id)
                VALUES ('{name}', '{age}', '{email}', '{phone}', '{login_id}')
            """
            db.single_insert(insUserQry)
            return jsonify({"success": True, "message": "Traveller registered successfully!"}), 201

        elif usertype == "Driver":
            license_no = data.get("license")  # Additional field for drivers
            cab_details = data.get("cabDetails")  # Cab details for drivers
            place = data.get("place")
            if not all([license_no, cab_details]):
                return jsonify({"success": False, "message": "License number and cab details are required for drivers."}), 400

            # Insert into tbl_driver
            insDriverQry = f"""
                INSERT INTO tbl_driver (name, age, phone, license_no, login_id)
                VALUES ('{name}', '{age}', '{phone}', '{license_no}', '{login_id}')
            """
            db.single_insert(insDriverQry)  # Assuming db.insert returns the auto-incremented id

            # Insert into tbl_cab
            insCabQry = f"""
                INSERT INTO tbl_cab (cab_details, driver_id, location_id)
                VALUES ('{cab_details}', '{login_id}','{place}')
            """
            db.single_insert(insCabQry)
            return jsonify({"success": True, "message": "Driver registered successfully!"}), 201

        else:
            return jsonify({"success": False, "message": "Invalid user type provided."}), 400

    except Exception as e:
        print("Error during registration:", str(e))
        return jsonify({"success": False, "message": "An error occurred during registration."}), 500


@app.route('/api/place', methods=['GET'])
def get_places():  # Renamed for clarity
    try:
        # Fetch all places
        selQry = "SELECT * FROM tbl_place"
        places = db.fetchall(selQry)

        # Fetch photos for each place
        place_data = []
        for place in places:
            photoQry = f"SELECT place_photo FROM tbl_place_photo WHERE place_id = {place['id']}"
            photos = db.fetchall(photoQry)
            # Extract only the photo URLs as a list
            photo_urls = [photo['place_photo'] for photo in photos] if photos else []

            # Construct place data with photos
            place_info = {
                "id": place['id'],
                "place_name": place['place_name'],
                "latitude": place['latitude'],
                "longitude": place['longitude'],
                "popular":place['popular'],
                "photos": photo_urls
            }
            place_data.append(place_info)

        return jsonify({
            "message": "Successfully fetched places",
            "places": place_data
        }), 200

    except Exception as e:
        return jsonify({
            "message": f"An error occurred: {str(e)}",
            "places": []
        }), 500
    
    
@app.route('/api/events', methods=['GET'])
def get_events():
    # Get place_id from the query parameters
    place_id = request.args.get('place_id')
    # Serialize events
    def serialize_event(event):
        return {
            "id": event["e_id"],
            "title": event["title"],
            "details": event["details"],
            "time": str(event["time"]) if isinstance(event["time"], timedelta) else event["time"].strftime('%H:%M:%S') if isinstance(event["time"], datetime) else event["time"],
            "date": event["date"],
            "place_name": event["place_name"],
            "latitude": event["latitude"],
            "longitude": event["longitude"]
        }




    if not place_id:
        return jsonify({"message": "place_id is required"}), 400

    try:
        if place_id=='all':
            selQry = f"SELECT e.id as e_id,title,details,time,date,place_name,latitude,longitude FROM tbl_event e join tbl_place p on e.location_id = p.id Order By e.id DESC"
            events = db.fetchall(selQry)
            serialized_events = [serialize_event(event) for event in events]

            return jsonify({"message": "successfully fetched events", "events": serialized_events}), 200
        else:
            selQry = f"SELECT e.id as e_id,title,details,time,date,place_name,latitude,longitude FROM tbl_event e join tbl_place p on e.location_id = p.id WHERE location_id = {place_id} Order By e.id DESC"
            events = db.fetchall(selQry) 
            serialized_events = [serialize_event(event) for event in events]

            return jsonify({"message": "successfully fetched events", "events": serialized_events}), 200
    except Exception as e:
        print(f"Error fetching events: {e}")
        return jsonify({"message": "An error occurred while fetching events"}), 500
    
    
@app.route('/api/hotels', methods=['GET'])
def get_hotels():
    # Get place_id from the query parameters
    place_id = request.args.get('place_id')

    if not place_id:
        return jsonify({"message": "place_id is required"}), 400

    try:
        if place_id=='all':
            selQry = f"SELECT h.id as id,name,contact,email,address,place_name,latitude,longitude,image,available_rooms FROM tbl_hotel h join tbl_place p on h.location_id = p.id Order By h.id DESC"
            hotels = db.fetchall(selQry)
            return jsonify({"message": "successfully fetched hotel", "hotels": hotels}), 200
        else:
            selQry = f"SELECT h.id as id,name,contact,email,address,place_name,latitude,longitude,image FROM tbl_hotel h join tbl_place p on h.location_id = p.id WHERE h.location_id = {place_id} Order By h.id DESC" 
            print(selQry)
            hotels = db.fetchall(selQry)
            return jsonify({"message": "successfully fetched hotels", "hotels": hotels}), 200
        
    except Exception as e:
        print(f"Error fetching hotels: {e}")
        return jsonify({"message": "An error occurred while fetching events"}), 500
    
@app.route('/api/guides', methods=['GET'])
def get_guids():
    # Get place_id from the query parameters
    place_id = request.args.get('place_id')
    if not place_id:
        return jsonify({"message": "place_id is required"}), 400

    try:
        if place_id=='all':
            selQry = f"SELECT g.id as id,`name`, `age`, `gender`, `phone_no`, `email`,`place_name` FROM tbl_guide g join tbl_place p on g.location_id = p.id Order By g.id DESC"
            guides = db.fetchall(selQry)
            return jsonify({"message": "successfully fetched events", "guides": guides}), 200
        else:       
            selQry = f"SELECT g.id as id,`name`, `age`, `gender`, `phone_no`, `email`,`place_name` FROM tbl_guide g join tbl_place p on g.location_id = p.id WHERE g.location_id = {place_id} Order By g.id DESC"
            guides = db.fetchall(selQry)
            return jsonify({"message": "successfully fetched events", "guides": guides}), 200
        
    except Exception as e:
        print(f"Error fetching events: {e}")
        return jsonify({"message": "An error occurred while fetching events"}), 500
    
@app.route('/api/cabs', methods=['GET']) 
def get_cab():
    place_id = request.args.get('place_id')
    if not place_id:
        return jsonify({"message": "place_id is required"}), 400
    try:
        if place_id=='all':
            selQry = f"SELECT c.id as id,cab_details,driver_id,name,age,phone,license_no,p.id as place_id,place_name FROM tbl_cab c join tbl_driver d on c.driver_id = d.login_id join tbl_login l on d.login_id = l.id join tbl_place p on c.location_id = p.id  Order By c.id DESC"
            cabs = db.fetchall(selQry)
            print(selQry)
            return jsonify({"message": "successfully fetched events", "cabs": cabs}), 200
        else:
            selQry = f"SELECT c.id as id,cab_details,driver_id,name,age,phone,license_no,p.id as place_id,place_name FROM tbl_cab c join tbl_driver d on c.driver_id = d.login_id  join tbl_place p on c.location_id = p.id WHERE c.location_id = {place_id} Order By c.id DESC"
            cabs = db.fetchall(selQry)
            print(selQry)
            return jsonify({"message": "successfully fetched events", "cabs": cabs}), 200
    except Exception as e:
        print(f"Error fetching events: {e}")
        return jsonify({"message": "An error occurred while fetching events"}), 500
    
@app.route('/api/spots', methods=['GET'])
def get_spots():
    place_id = request.args.get('place_id')
    if not place_id:
        return jsonify({"message": "place_id is required"}), 400
    try:
        if place_id=='all':
            selQry = f"SELECT s.id as id,name,details,image,place_name FROM tbl_spot s join tbl_place p on s.place_id = p.id Order By s.id DESC"
            spots = db.fetchall(selQry)
            return jsonify({"message": "successfully fetched events", "spots": spots}), 200
        else:
            selQry = f"SELECT s.id as id,name,details,image,place_name FROM tbl_spot s join tbl_place p on s.place_id = p.id WHERE s.place_id = {place_id} Order By s.id DESC"
            print(selQry)
            spots = db.fetchall(selQry)
            return jsonify({"message": "successfully fetched events", "spots": spots}), 200
    except Exception as e:
        print(f"Error fetching events: {e}")
        return jsonify({"message": "An error occurred while fetching events"}), 500
    

language_map = {
    "hi": sanscript.DEVANAGARI,  # Hindi
    "ta": sanscript.TAMIL,       # Tamil
    "bn": sanscript.BENGALI,     # Bengali
    "gu": sanscript.GUJARATI,    # Gujarati
    "kn": sanscript.KANNADA,     # Kannada
    "ml": sanscript.MALAYALAM,   # Malayalam
    "mr": sanscript.DEVANAGARI,  # Marathi (also uses Devanagari)
    "pa": sanscript.GURMUKHI,    # Punjabi
    "te": sanscript.TELUGU,      # Telugu
}

# @app.route('/api/translate', methods=['POST'])
# def translate_text():
#     data = request.json
#     text = data.get("text", "")
#     lang = data.get("lang", "")

#     if lang not in language_map:
#         return jsonify({"error": "Unsupported language"}), 400

#     transliterated_text = transliterate(text, language_map[lang], sanscript.ITRANS)
#     print(transliterated_text)

#     return jsonify({"original_text": text, "transliterated_text": transliterated_text})

import google.generativeai as genai
API_KEY='AIzaSyAbzNnyKxrjoJRBDakvvrAO0NIiKpLkZuo'
genai.configure(api_key=API_KEY)

@app.route('/api/translate', methods=['POST'])
def translate_text():
    data = request.json
    text = data.get("text", "")
    lang = data.get("lang", "")
    print(text)
    print("lang",lang)
    model = genai.GenerativeModel("gemini-1.5-flash")
    prompt = f"Transliterate the following text in the {lang} to English: {text}, only need the result no other data needed and no special charector needed, once again note, only transliterate the text, not translate."

    try:
        response = model.generate_content(prompt)
        print(response.text)
        transliterated_text=response.text
        return jsonify({"original_text": text, "transliterated_text": transliterated_text})
    except Exception as e:
        return jsonify({"error": str(e)}), 500



@app.route('/api/bookcab', methods=['POST'])
def book_cab():
    try:
        data = request.json
        cab_id=data.get("cab_id")
        login_id=data.get("login_id")
        start_point=data.get("start_point")
        destination=data.get("destination")
        qry=f"insert into tbl_booking (cab_id,login_id,start_point,destination,status) values ({cab_id},{login_id},'{start_point}','{destination}','booked');"
        book=db.single_insert(qry)
        return jsonify({"message": "successfully fetched events", "book": book}), 200
    except Exception as e:
        print(f"Error Booking Cab: {e}")
        return jsonify({"message": "An error occurred while Error Booking Cab"}), 500
    
    

#api for select booking with login_id
@app.route('/api/bookingByUser/<userId>', methods=['GET'])
def bookingByUser(userId):
    login_id = userId
    if not login_id:
        print("login_id is required")
        return jsonify({"message": "login_id is required"}), 400
    try:
        selQry = f"SELECT b.id as id,cab_id,b.login_id,start_point,destination,b.status,d.name as d_name,p.place_name as start,p1.place_name as end FROM tbl_booking b join tbl_cab c on b.cab_id = c.id join tbl_driver d on c.driver_id = d.login_id join tbl_place p on b.start_point = p.id join tbl_place p1 on b.destination = p1.id where b.login_id = {login_id} Order By b.id DESC"
        print(selQry)
        booking = db.fetchall(selQry)
        return jsonify({"message": "successfully fetched events", "bookings": booking}), 200
    except Exception as e:
        print(f"Error fetching events: {e}")
        return jsonify({"message": "An error occurred while fetching events"}), 500        

#api for select booking with driver_id
@app.route('/api/bookingByDriver/<driverId>', methods=['GET'])
def bookingByDriver(driverId):
    driver_id = driverId
    if not driver_id:
        print("driver_id is required")
        return jsonify({"message": "driver_id is required"}), 400
    try:
        selQry = f"SELECT b.id as id,cab_id,b.login_id,start_point,destination,b.status,p.place_name as start,p1.place_name as stop,u.name,u.phone FROM tbl_booking b join tbl_cab c on b.cab_id = c.id join tbl_driver d on c.driver_id = d.login_id join tbl_place p on b.start_point = p.id join tbl_place p1 on b.destination = p1.id join tbl_user u on u.login_id=b.login_id where c.driver_id  = {driver_id} Order By b.id DESC"   
        print(selQry)
        booking = db.fetchall(selQry)
        return jsonify({"message": "successfully fetched events", "bookings": booking}), 200
    except Exception as e:
        print(f"Error fetching events: {e}")
        return jsonify({"message": "An error occurred while fetching events"}), 500
# New endpoint for location update
@app.route('/api/updateDriverLocation', methods=['POST'])
def update_driver_location():
    data = request.get_json()
    driver_id = data.get('driverId')
    latitude = data.get('latitude')
    longitude = data.get('longitude')
    booking_id = data.get('bookingId')
    print(f"Driver ID: {driver_id}, Latitude: {latitude}, Longitude: {longitude}, Booking ID: {booking_id}")
    try:
        upsertQry = f"""
            INSERT INTO tbl_tracking (driver_id, booking_id, latitude, longitude, updated_at)
            VALUES ({driver_id}, {booking_id}, {latitude}, {longitude}, NOW())
            ON DUPLICATE KEY UPDATE latitude = {latitude}, longitude = {longitude}, updated_at = NOW()
        """
        db.execute(upsertQry)
        return jsonify({"message": "Location updated"}), 200
    except Exception as e:
        return jsonify({"message": f"Error updating location: {e}"}), 500
    
@app.route('/api/cancelBooking/<booking_id>', methods=['PUT'])
def cancelBooking(booking_id):
    try:
        # Update status to cancelled
        update_query = f"UPDATE tbl_booking SET status = 'cancelled' WHERE id ={booking_id}"
        db.execute(update_query)

        return jsonify({"success": True, "message": "Booking cancelled successfully"}), 200

    except Exception as e:
        print(f"Error cancelling booking: {str(e)}")
        return jsonify({"success": False, "message": f"An error occurred: {str(e)}"}), 500
    
# Accept booking endpoint
@app.route('/api/acceptBooking/<bookingId>', methods=['PUT'])
def accept_booking(bookingId):
    try:
        updateQry = f"UPDATE tbl_booking SET status = 'ongoing' WHERE id = {bookingId}"
        db.execute(updateQry)
        db.commit()
        return jsonify({"message": "Booking accepted"}), 200
    except Exception as e:
        return jsonify({"message": f"Error accepting booking: {e}"}), 500 
    
#complete booking
@app.route('/api/completeBooking/<bookingId>', methods=['PUT'])
def complete_booking(bookingId):
    try:
        updateQry = f"UPDATE tbl_booking SET status = 'completed' WHERE id = {bookingId}"
        db.execute(updateQry)
        return jsonify({"message": "Booking completed"}), 200
    except Exception as e:    
        return jsonify({"message": f"Error accepting booking: {e}"}), 500
    

# @#tempMail
@app.route('/api/speech-to-text', methods=['POST'])
def speech_to_text():
    try:
        print("Received request for speech-to-text")
        if 'audio' not in request.files:
            print("Error: No audio file provided in request")
            return jsonify({"success": False, "error": "No audio file provided"}), 400
        
        audio_file = request.files['audio']
        print(f"Audio file received: {audio_file.filename}")
        
        # Save the file temporarily
        temp_path = os.path.join("static/tmp", audio_file.filename)
        audio_file.save(temp_path)
        print(f"Audio file saved temporarily at: {temp_path}")
        aai.settings.api_key = "a34a41186f85475582ffb55772bf9ea1"
        transcriber = aai.Transcriber()
        # Convert to PCM WAV format if needed
        transcript = transcriber.transcribe(temp_path)
        if transcript.status == aai.TranscriptStatus.error:
            print(transcript.error)
        else:
            print(transcript.text)
        text = transcript.text
        
        # Clean up temporary files
        os.remove(temp_path)
        print("Temporary file removed")
        
        return jsonify({"success": True, "text": text}), 200
    
    except Exception as e:
        print(f"Unexpected error in speech-to-text: {str(e)}")
        return jsonify({"success": False, "error": f"An error occurred: {str(e)}"}), 500
    


@app.route('/api/tracking/<bookingId>', methods=['GET'])
def get_tracking(bookingId):
    try:
        # Fetch the latest tracking data (most recent by id)
        latest_qry = f"SELECT * FROM tbl_tracking WHERE booking_id = {bookingId} ORDER BY id DESC LIMIT 1"
        latest_result = db.fetchone(latest_qry)
        
        # Fetch the first tracking data (earliest by id)
        first_qry = f"SELECT * FROM tbl_tracking WHERE booking_id = {bookingId} ORDER BY id ASC LIMIT 1"
        first_result = db.fetchone(first_qry)

        tracking_data = {}
        if latest_result:
            tracking_data['latest'] = {
                "latitude": str(latest_result['latitude']),
                "longitude": str(latest_result['longitude']),
                "booking_id": latest_result['booking_id'],
                "driver_id": latest_result['driver_id'],
            }
        if first_result:
            tracking_data['first'] = {
                "latitude": str(first_result['latitude']),
                "longitude": str(first_result['longitude']),
                "booking_id": first_result['booking_id'],
            }

        if tracking_data:
            return jsonify({"success": True, "data": tracking_data}), 200
        else:
            return jsonify({"success": False, "message": "No tracking data found for this booking"}), 404
    except Exception as e:
        print(f"Error fetching tracking data: {e}")
        return jsonify({"success": False, "message": f"Error fetching tracking data: {e}"}), 500
    
@app.route('/api/reviews/<placeId>', methods=['GET', 'POST'])
def get_reviews(placeId):
    if request.method == 'GET':
        try:
            qry = f"SELECT r.id, r.rating, r.comment, r.image_url, u.name, r.date FROM tbl_review r JOIN tbl_user u ON r.user_id = u.login_id WHERE place_id = {placeId}"
            reviews = db.fetchall(qry)
            return jsonify({"success": True, "data": reviews}), 200  
        except Exception as e:
            print(f"Error fetching reviews: {e}")
            return jsonify({"success": False, "message": f"Error fetching reviews: {e}"}), 500
    else:
        try:
            # Handle image upload
            image = request.files.get('image')
            image_url = None
            if image and image.filename:
                filename = image.filename
                
                image_path = os.path.join("static/review_uploads", filename)
                image.save(image_path)
                image_url = f"review_uploads/{filename}"  # Relative path for database
                
            # Get form data (assuming multipart/form-data from frontend)
            rating = request.form.get('rating')
            comment = request.form.get('review_text')
            user_id = request.form.get('user_id')

            if not all([rating, comment, user_id]):
                return jsonify({"success": False, "message": "Rating, review text, and user ID are required"}), 400

            # Insert into database
            image_value = f"'{image_url}'" if image_url else 'NULL'
            qry = f"INSERT INTO tbl_review (place_id, user_id, rating, comment, image_url) VALUES ({placeId}, '{user_id}', {rating}, '{comment}', {image_value})"
            print(qry)
            db.single_insert(qry)
            return jsonify({"success": True, "message": "Review added successfully"}), 200
        except Exception as e:
            print(f"Error adding review: {e}")
            return jsonify({"success": False, "message": f"Error adding review: {e}"}), 500

 
@app.route('/api/hotel_reviews/<hotelId>', methods=['GET', 'POST'])
def get_hotel_reviews(hotelId):
    if request.method == 'GET':
        try:
            qry = f"SELECT r.id, r.rating, r.review, r.image_url, u.name, r.date FROM tbl_hotel_review r JOIN tbl_user u ON r.user_id = u.login_id WHERE hotel_id = {hotelId}"
            reviews = db.fetchall(qry)
            return jsonify({"success": True, "data": reviews}), 200  
        except Exception as e:
            print(f"Error fetching reviews: {e}")
            return jsonify({"success": False, "message": f"Error fetching reviews: {e}"}), 500
    else:
        try:
            # Handle image upload
            image = request.files.get('image')
            image_url = None
            if image and image.filename:
                filename = image.filename
                
                image_path = os.path.join("static/hotel_review_uploads", filename)
                image.save(image_path)
                image_url = f"hotel_review_uploads/{filename}"  # Relative path for database
                
            # Get form data (assuming multipart/form-data from frontend)
            rating = request.form.get('rating')
            review = request.form.get('review_text')
            user_id = request.form.get('user_id')

            if not all([rating, review, user_id]):
                return jsonify({"success": False, "message": "Rating, review text, and user ID are required"}), 400

            # Insert into database
            image_value = f"'{image_url}'" if image_url else 'NULL'
            qry = f"INSERT INTO tbl_hotel_review (hotel_id, user_id, rating, review, image_url) VALUES ({hotelId}, '{user_id}', {rating}, '{review}', {image_value})"
            print(qry)
            db.single_insert(qry)
            return jsonify({"success": True, "message": "Review added successfully"}), 200
        except Exception as e:
            print(f"Error adding review: {e}")
            return jsonify({"success": False, "message": f"Error adding review: {e}"}), 500

@app.route('/api/hotels/<int:hotelId>', methods=['GET'])
def get_hotel(hotelId):
    try:
        qry = f"SELECT * FROM tbl_hotel WHERE id = {hotelId}"
        hotel = db.fetchone(qry)
        if not hotel:
            return jsonify({"success": False, "message": "Hotel not found"}), 404
        return jsonify({"success": True, "hotel": hotel}), 200
    except Exception as e:
        print(f"Error fetching hotel: {e}")
        return jsonify({"success": False, "message": f"Error fetching hotel: {e}"}), 500
    
    

# running application 
if __name__ == '__main__': 
    app.run(host='0.0.0.0', port=5000, debug=True) 