import uuid
from unittest.mock import MagicMock, patch

from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from apps.authentication.tests.factories import UserFactory
from apps.notes.models import Category, Note
from apps.notes.tests.factories import NoteFactory


class NoteViewSetListTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = UserFactory()
        self.client.force_authenticate(user=self.user)

    @patch("apps.notes.views.NoteService.get_user_notes")
    def test_list_returns_200(self, mock_get: MagicMock):
        mock_get.return_value = Note.objects.none()

        response = self.client.get("/api/v1/notes/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        mock_get.assert_called_once_with(self.user)

    @patch("apps.notes.views.NoteService.get_user_notes")
    def test_list_with_valid_category_filter(self, mock_get: MagicMock):
        mock_get.return_value = Note.objects.none()

        response = self.client.get("/api/v1/notes/?category=school")

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    @patch("apps.notes.views.NoteService.get_user_notes")
    def test_list_with_invalid_category_returns_400(self, mock_get: MagicMock):
        mock_get.return_value = Note.objects.none()

        response = self.client.get("/api/v1/notes/?category=invalid")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_list_unauthenticated_returns_401(self):
        self.client.force_authenticate(user=None)

        response = self.client.get("/api/v1/notes/")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class NoteViewSetCreateTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = UserFactory()
        self.client.force_authenticate(user=self.user)

    @patch("apps.notes.views.NoteService.create_note")
    def test_create_returns_201(self, mock_create: MagicMock):
        note = NoteFactory.build(owner=self.user)
        mock_create.return_value = note
        payload = {
            "title": "My Note",
            "body": "Some content",
            "category": "school",
        }

        response = self.client.post("/api/v1/notes/", payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        mock_create.assert_called_once()
        call_args = mock_create.call_args
        self.assertEqual(call_args[0][0]["title"], "My Note")
        self.assertEqual(call_args[0][0]["body"], "Some content")
        self.assertEqual(call_args[0][0]["category"], "school")
        self.assertEqual(call_args[0][1], self.user)

    @patch("apps.notes.views.NoteService.create_note")
    def test_create_with_blank_title_returns_400(self, mock_create: MagicMock):
        payload = {"title": "   ", "body": "content"}

        response = self.client.post("/api/v1/notes/", payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        mock_create.assert_not_called()

    @patch("apps.notes.views.NoteService.create_note")
    def test_create_with_empty_title_returns_400(self, mock_create: MagicMock):
        payload = {"title": "", "body": "content"}

        response = self.client.post("/api/v1/notes/", payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        mock_create.assert_not_called()

    @patch("apps.notes.views.NoteService.create_note")
    def test_create_with_missing_title_returns_400(self, mock_create: MagicMock):
        payload = {"body": "content"}

        response = self.client.post("/api/v1/notes/", payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        mock_create.assert_not_called()

    @patch("apps.notes.views.NoteService.create_note")
    def test_create_with_invalid_category_returns_400(self, mock_create: MagicMock):
        payload = {"title": "T", "body": "B", "category": "invalid"}

        response = self.client.post("/api/v1/notes/", payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        mock_create.assert_not_called()

    def test_create_unauthenticated_returns_401(self):
        self.client.force_authenticate(user=None)
        payload = {"title": "T", "body": "B"}

        response = self.client.post("/api/v1/notes/", payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    @patch("apps.notes.views.NoteService.create_note")
    def test_create_uses_default_category(self, mock_create: MagicMock):
        note = NoteFactory.build(owner=self.user, category=Category.PERSONAL)
        mock_create.return_value = note
        payload = {"title": "My Note", "body": "content"}

        response = self.client.post("/api/v1/notes/", payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)


class NoteViewSetPartialUpdateTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = UserFactory()
        self.client.force_authenticate(user=self.user)

    @patch("apps.notes.views.NoteService.partial_update")
    @patch("apps.notes.views.NoteService.get_user_notes")
    def test_patch_returns_200(self, mock_get: MagicMock, mock_update: MagicMock):
        note = NoteFactory(owner=self.user)
        mock_get.return_value = Note.objects.filter(pk=note.pk)
        mock_update.return_value = note

        response = self.client.patch(
            f"/api/v1/notes/{note.pk}/",
            {"title": "Updated"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        mock_update.assert_called_once()

    @patch("apps.notes.views.NoteService.get_user_notes")
    def test_patch_other_users_note_returns_404(self, mock_get: MagicMock):
        mock_get.return_value = Note.objects.none()
        fake_id = uuid.uuid4()

        response = self.client.patch(
            f"/api/v1/notes/{fake_id}/",
            {"title": "Hacked"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    @patch("apps.notes.views.NoteService.partial_update")
    @patch("apps.notes.views.NoteService.get_user_notes")
    def test_patch_blank_title_returns_400(
        self, mock_get: MagicMock, mock_update: MagicMock
    ):
        note = NoteFactory(owner=self.user)
        mock_get.return_value = Note.objects.filter(pk=note.pk)

        response = self.client.patch(
            f"/api/v1/notes/{note.pk}/",
            {"title": "   "},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        mock_update.assert_not_called()

    @patch("apps.notes.views.NoteService.partial_update")
    @patch("apps.notes.views.NoteService.get_user_notes")
    def test_patch_empty_body_returns_400(
        self, mock_get: MagicMock, mock_update: MagicMock
    ):
        note = NoteFactory(owner=self.user)
        mock_get.return_value = Note.objects.filter(pk=note.pk)

        response = self.client.patch(
            f"/api/v1/notes/{note.pk}/",
            {},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        mock_update.assert_not_called()

    def test_patch_unauthenticated_returns_401(self):
        self.client.force_authenticate(user=None)
        fake_id = uuid.uuid4()

        response = self.client.patch(
            f"/api/v1/notes/{fake_id}/",
            {"title": "Updated"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class NoteViewSetRetrieveTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = UserFactory()
        self.client.force_authenticate(user=self.user)

    @patch("apps.notes.views.NoteService.get_user_notes")
    def test_retrieve_returns_200(self, mock_get: MagicMock):
        note = NoteFactory(owner=self.user)
        mock_get.return_value = Note.objects.filter(pk=note.pk)

        response = self.client.get(f"/api/v1/notes/{note.pk}/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], str(note.pk))

    @patch("apps.notes.views.NoteService.get_user_notes")
    def test_retrieve_other_users_note_returns_404(self, mock_get: MagicMock):
        mock_get.return_value = Note.objects.none()
        fake_id = uuid.uuid4()

        response = self.client.get(f"/api/v1/notes/{fake_id}/")

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class NoteViewSetMethodNotAllowedTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = UserFactory()
        self.client.force_authenticate(user=self.user)

    def test_put_returns_405(self):
        fake_id = uuid.uuid4()

        response = self.client.put(
            f"/api/v1/notes/{fake_id}/",
            {"title": "T", "body": "B"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

    def test_delete_returns_405(self):
        fake_id = uuid.uuid4()

        response = self.client.delete(f"/api/v1/notes/{fake_id}/")

        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
