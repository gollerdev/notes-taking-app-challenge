from unittest.mock import MagicMock, patch

from django.test import TestCase
from parameterized import parameterized

from apps.authentication.models import User
from apps.authentication.tests.factories import UserFactory
from apps.notes.models import Note
from apps.notes.services import NoteService
from apps.notes.tests.factories import NoteFactory


class NoteServiceGetUserNotesTest(TestCase):
    @patch("apps.notes.services.NoteRepository.get_by_user")
    def test_delegates_to_repository(self, mock_get: MagicMock):
        user = UserFactory()
        mock_get.return_value = Note.objects.none()

        NoteService.get_user_notes(user)

        mock_get.assert_called_once_with(user)

    @patch("apps.notes.services.NoteRepository")
    def test_no_other_repository_methods_called(self, mock_repo: MagicMock):
        user = UserFactory()
        mock_repo.get_by_user.return_value = Note.objects.none()

        NoteService.get_user_notes(user)

        all_calls = [name for name, _, _ in mock_repo.mock_calls]
        self.assertEqual(all_calls, ["get_by_user"])

    @parameterized.expand(
        [
            ("none_user", None, TypeError),
            ("string_user", "not a user", TypeError),
            ("unsaved_user", User(), ValueError),
        ]
    )
    def test_invalid_user_raises(self, _name, user, expected_exc):
        with self.assertRaises(expected_exc):
            NoteService.get_user_notes(user)


class NoteServiceCreateNoteTest(TestCase):
    @patch("apps.notes.services.NoteRepository.create")
    def test_delegates_to_repository(self, mock_create: MagicMock):
        user = UserFactory()
        data = {"title": "T", "body": "B"}
        mock_create.return_value = NoteFactory.build()

        NoteService.create_note(data, user)

        mock_create.assert_called_once_with(data, owner=user)

    @patch("apps.notes.services.NoteRepository")
    def test_no_other_repository_methods_called(self, mock_repo: MagicMock):
        user = UserFactory()
        mock_repo.create.return_value = NoteFactory.build()

        NoteService.create_note({"title": "T", "body": "B"}, user)

        all_calls = [name for name, _, _ in mock_repo.mock_calls]
        self.assertEqual(all_calls, ["create"])

    @parameterized.expand(
        [
            ("none_data", None, "valid", TypeError),
            ("string_data", "not a dict", "valid", TypeError),
            ("list_data", [], "valid", TypeError),
            ("empty_dict", {}, "valid", ValueError),
            ("none_user", {"title": "T"}, None, TypeError),
            ("string_user", {"title": "T"}, "not a user", TypeError),
            ("unsaved_user", {"title": "T"}, User(), ValueError),
        ]
    )
    def test_invalid_params_raise(self, _name, data, user, expected_exc):
        if user == "valid":
            user = UserFactory()
        with self.assertRaises(expected_exc):
            NoteService.create_note(data, user)


class NoteServicePartialUpdateTest(TestCase):
    @patch("apps.notes.services.NoteRepository.update")
    def test_delegates_to_repository(self, mock_update: MagicMock):
        note = NoteFactory.build()
        data = {"title": "New"}
        mock_update.return_value = note

        NoteService.partial_update(note, data)

        mock_update.assert_called_once_with(note, data)

    @patch("apps.notes.services.NoteRepository")
    def test_no_other_repository_methods_called(self, mock_repo: MagicMock):
        note = NoteFactory.build()
        mock_repo.update.return_value = note

        NoteService.partial_update(note, {"title": "New"})

        all_calls = [name for name, _, _ in mock_repo.mock_calls]
        self.assertEqual(all_calls, ["update"])

    @parameterized.expand(
        [
            ("none_note", None, {"title": "T"}, TypeError),
            ("string_note", "not a note", {"title": "T"}, TypeError),
            ("none_data", "valid_note", None, TypeError),
            ("string_data", "valid_note", "not a dict", TypeError),
            ("list_data", "valid_note", [], TypeError),
            ("empty_dict", "valid_note", {}, ValueError),
        ]
    )
    def test_invalid_params_raise(self, _name, note, data, expected_exc):
        if note == "valid_note":
            note = NoteFactory.build()
        with self.assertRaises(expected_exc):
            NoteService.partial_update(note, data)
