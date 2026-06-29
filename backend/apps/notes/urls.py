"""URL routes for the notes app."""

from rest_framework.routers import DefaultRouter

from apps.notes.views import NoteViewSet

router = DefaultRouter()
router.register("notes", NoteViewSet, basename="note")

urlpatterns = router.urls
